export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OpportunityStatus = "Saved" | "Outreach" | "Replied" | "Closed";
export type OpportunityType = "Job" | "Internship" | "Fellowship";
export type DomainStatus = "mx_found" | "no_mx" | "invalid_domain" | "check_failed";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      user_profiles: Table<
        {
          user_id: string;
          resume_path: string | null;
          resume_name: string | null;
          gmail_notifications: boolean;
          custom_apis_enabled: boolean;
          gemini_api_key_ciphertext: string | null;
          groq_api_key_ciphertext: string | null;
          nvidia_api_key_ciphertext: string | null;
          candidate_profile: Json | null;
          candidate_profile_updated_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          user_id: string;
          resume_path?: string | null;
          resume_name?: string | null;
          gmail_notifications?: boolean;
          custom_apis_enabled?: boolean;
          gemini_api_key_ciphertext?: string | null;
          groq_api_key_ciphertext?: string | null;
          nvidia_api_key_ciphertext?: string | null;
          candidate_profile?: Json | null;
          candidate_profile_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          resume_path?: string | null;
          resume_name?: string | null;
          gmail_notifications?: boolean;
          custom_apis_enabled?: boolean;
          gemini_api_key_ciphertext?: string | null;
          groq_api_key_ciphertext?: string | null;
          nvidia_api_key_ciphertext?: string | null;
          candidate_profile?: Json | null;
          candidate_profile_updated_at?: string | null;
          updated_at?: string;
        }
      >;
      outreach_drafts: Table<
        {
          id: string;
          user_id: string;
          job_guid: string;
          job_title: string;
          company: string;
          application_link: string;
          recruiter_name: string;
          recruiter_email: string;
          subject: string;
          body: string;
          status: "draft" | "approved" | "sending" | "sent";
          gmail_message_id: string | null;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
          sent_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          job_guid: string;
          job_title: string;
          company: string;
          application_link: string;
          recruiter_name?: string;
          recruiter_email: string;
          subject: string;
          body: string;
          status?: "draft" | "approved" | "sending" | "sent";
          gmail_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          sent_at?: string | null;
        },
        {
          recruiter_name?: string;
          recruiter_email?: string;
          subject?: string;
          body?: string;
          status?: "draft" | "approved" | "sending" | "sent";
          gmail_message_id?: string | null;
          updated_at?: string;
          approved_at?: string | null;
          sent_at?: string | null;
        }
      >;
      opportunities: Table<
        {
          id: string;
          user_id: string;
          title: string;
          company: string;
          location: string | null;
          opportunity_type: OpportunityType;
          job_url: string | null;
          description: string | null;
          status: OpportunityStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          location?: string | null;
          opportunity_type: OpportunityType;
          job_url?: string | null;
          description?: string | null;
          status?: OpportunityStatus;
          created_at?: string;
          updated_at?: string;
        },
        {
          title?: string;
          company?: string;
          location?: string | null;
          opportunity_type?: OpportunityType;
          job_url?: string | null;
          description?: string | null;
          status?: OpportunityStatus;
          updated_at?: string;
        }
      >;
      recruiter_contacts: Table<
        {
          id: string;
          user_id: string;
          name: string;
          title: string;
          company: string;
          email: string;
          domain: string;
          domain_status: DomainStatus;
          check_message: string;
          checked_at: string;
          do_not_contact: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          name?: string;
          title?: string;
          company: string;
          email: string;
          domain: string;
          domain_status: DomainStatus;
          check_message: string;
          checked_at?: string;
          do_not_contact?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          title?: string;
          company?: string;
          email?: string;
          domain?: string;
          domain_status?: DomainStatus;
          check_message?: string;
          checked_at?: string;
          do_not_contact?: boolean;
          updated_at?: string;
        }
      >;
      discovery_logs: Table<
        {
          id: string;
          user_id: string;
          contact_id: string | null;
          step: string;
          result: Json;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          contact_id?: string | null;
          step: string;
          result?: Json;
          created_at?: string;
        },
        never
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
