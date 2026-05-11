create table evaluation_audits (
    id uuid primary key,
    principal varchar(512) not null,
    action varchar(512) not null,
    resource varchar(512) not null,
    context_json text not null,
    entities_json text not null,
    decision varchar(32) not null,
    matched_policies_json text not null,
    errors_json text not null,
    created_at timestamp with time zone not null
);
