import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Project, ProjectItem, ProjectDetail, ProjectSummary } from '@/types'

function extractResults<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects/')
      return extractResults<Project>(res.data)
    },
  })
}

export function useProject(id: number) {
  return useQuery<ProjectDetail>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}/`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useProjectSummary() {
  return useQuery<ProjectSummary>({
    queryKey: ['projects', 'summary'],
    queryFn: async () => {
      const res = await api.get('/projects/summary/')
      return res.data
    },
  })
}

export function useProjectItems(projectId: number) {
  return useQuery<ProjectItem[]>({
    queryKey: ['projects', projectId, 'items'],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/items/with_spent/`)
      return extractResults<ProjectItem>(res.data)
    },
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      status?: string
      start_date?: string
      end_date?: string
    }): Promise<Project> => {
      const res = await api.post('/projects/', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: number
      name?: string
      description?: string
      status?: string
      start_date?: string | null
      end_date?: string | null
    }): Promise<Project> => {
      const res = await api.put(`/projects/${id}/`, payload)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/projects/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useCreateProjectItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, ...payload }: {
      projectId: number
      name: string
      estimated_amount: string
      notes?: string
      order?: number
    }): Promise<ProjectItem> => {
      const res = await api.post(`/projects/${projectId}/items/`, payload)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'items'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] })
    },
  })
}

export function useUpdateProjectItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, itemId, ...payload }: {
      projectId: number
      itemId: number
      name?: string
      estimated_amount?: string
      notes?: string
      order?: number
    }): Promise<ProjectItem> => {
      const res = await api.put(`/projects/${projectId}/items/${itemId}/`, payload)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'items'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] })
    },
  })
}

export function useDeleteProjectItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, itemId }: { projectId: number; itemId: number }) => {
      await api.delete(`/projects/${projectId}/items/${itemId}/`)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'items'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] })
    },
  })
}
