// Auto-generated types placeholder.
// In production, run: npm run db:types
// This file provides manual types for development until Supabase CLI is set up.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          location: string | null;
          linkedin_url: string | null;
          portfolio_url: string | null;
          headline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          phone?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          headline?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_master: boolean;
          file_path: string | null;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          is_master?: boolean;
          file_path?: string | null;
          file_type?: string | null;
          file_size?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["resumes"]["Insert"]>;
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string;
          location: string | null;
          work_mode: string | null;
          description: string | null;
          requirements: Json | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string;
          source: string | null;
          source_url: string | null;
          ats_platform: string | null;
          raw_data: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          location?: string | null;
          work_mode?: string | null;
          description?: string | null;
          requirements?: Json | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string;
          source?: string | null;
          source_url?: string | null;
          ats_platform?: string | null;
          raw_data?: Json | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          status: string;
          resume_version_id: string | null;
          cover_letter_id: string | null;
          applied_at: string | null;
          follow_up_date: string | null;
          compensation_notes: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id: string;
          status?: string;
          resume_version_id?: string | null;
          cover_letter_id?: string | null;
          applied_at?: string | null;
          follow_up_date?: string | null;
          compensation_notes?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      job_scores: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          fit_score: number;
          strengths: Json;
          gaps: Json;
          risk_flags: Json;
          interview_angle: string | null;
          recommendation: string | null;
          explanation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id: string;
          fit_score: number;
          strengths?: Json;
          gaps?: Json;
          risk_flags?: Json;
          interview_angle?: string | null;
          recommendation?: string | null;
          explanation?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["job_scores"]["Insert"]>;
      };
      logs: {
        Row: {
          id: string;
          user_id: string | null;
          category: string;
          level: string;
          message: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          category: string;
          level?: string;
          message: string;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["logs"]["Insert"]>;
      };
    };
  };
}
