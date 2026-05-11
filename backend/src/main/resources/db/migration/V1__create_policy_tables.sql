create table policies (
    id uuid primary key,
    name varchar(255) not null,
    description text,
    policy_type varchar(64) not null,
    cedar_text text not null,
    status varchar(64) not null,
    version integer not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table policy_versions (
    id uuid primary key,
    policy_id uuid not null,
    version integer not null,
    cedar_text text not null,
    change_note text,
    created_at timestamp with time zone not null,
    constraint fk_policy_versions_policy foreign key (policy_id) references policies(id)
);
