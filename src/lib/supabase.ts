import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database types
export interface Project {
  id: string
  user_id: string
  name: string
  characters: any[]
  script_html: string
  story_html: string
  orchestration: any | null
  created_at: string
  updated_at: string
  is_public: boolean
  tags: string[]
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Cloud storage functions
export class CloudStorage {
  static async saveProject(projectData: {
    name: string
    characters: any[]
    scriptHtml: string
    storyHtml: string
    orchestration?: any
    isPublic?: boolean
    tags?: string[]
  }): Promise<Project | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .upsert({
          user_id: user.id,
          name: projectData.name,
          characters: projectData.characters,
          script_html: projectData.scriptHtml,
          story_html: projectData.storyHtml,
          orchestration: projectData.orchestration || null,
          is_public: projectData.isPublic || false,
          tags: projectData.tags || [],
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to save project:', error)
      return null
    }
  }

  static async loadProject(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to load project:', error)
      return null
    }
  }

  static async loadUserProjects(): Promise<Project[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to load user projects:', error)
      return []
    }
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  static async uploadFile(file: File, path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Failed to upload file:', error)
      return null
    }
  }

  static async getPublicProjects(limit = 20): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to load public projects:', error)
      return []
    }
  }

  // Real-time subscriptions
  static subscribeToProject(projectId: string, callback: (project: Project) => void) {
    return supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          callback(payload.new as Project)
        }
      )
      .subscribe()
  }

  static subscribeToUserProjects(userId: string, callback: (projects: Project[]) => void) {
    return supabase
      .channel(`user-projects-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Reload all projects when any change occurs
          const projects = await CloudStorage.loadUserProjects()
          callback(projects)
        }
      )
      .subscribe()
  }
}

// Authentication helpers
export class Auth {
  static async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error
    return data
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  static async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })

    if (error) throw error
    return data
  }

  // Auth state listener
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}