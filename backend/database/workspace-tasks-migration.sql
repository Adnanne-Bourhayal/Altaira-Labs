BEGIN;

CREATE TABLE IF NOT EXISTS workspace_tasks (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
    project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    service_key VARCHAR(80) NOT NULL DEFAULT 'general',
    title VARCHAR(240) NOT NULL,
    description TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'not_started',
    priority VARCHAR(24) NOT NULL DEFAULT 'normal',
    owner_role VARCHAR(24) NOT NULL DEFAULT 'admin',
    visibility VARCHAR(32) NOT NULL DEFAULT 'admin_only',
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_workspace_tasks_status CHECK (
        status IN (
            'not_started',
            'in_progress',
            'submitted',
            'needs_review',
            'approved',
            'rejected',
            'blocked',
            'completed'
        )
    ),
    CONSTRAINT chk_workspace_tasks_priority CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    CONSTRAINT chk_workspace_tasks_owner_role CHECK (
        owner_role IN ('admin', 'client')
    ),
    CONSTRAINT chk_workspace_tasks_visibility CHECK (
        visibility IN ('admin_only', 'client_visible')
    )
);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_client_status
    ON workspace_tasks(client_id, status);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_service_status
    ON workspace_tasks(service_key, status);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_project
    ON workspace_tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_due_at
    ON workspace_tasks(due_at);

COMMIT;
