package com.example.agentpolicy.policy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "policies")
public class Policy {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyType policyType;

    @Column(nullable = false, columnDefinition = "text")
    private String cedarText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyStatus status;

    @Column(nullable = false)
    private int version;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Policy() {
    }

    private Policy(UUID id, String name, String description, PolicyType policyType, String cedarText, Instant now) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.policyType = policyType;
        this.cedarText = cedarText;
        this.status = PolicyStatus.DRAFT;
        this.version = 1;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public static Policy create(String name, String description, PolicyType policyType, String cedarText) {
        return new Policy(UUID.randomUUID(), name, description, policyType, cedarText, Instant.now());
    }

    public void update(String name, String description, PolicyType policyType, String cedarText) {
        this.name = name;
        this.description = description;
        this.policyType = policyType;
        this.cedarText = cedarText;
        this.version += 1;
        this.updatedAt = Instant.now();
    }

    public void enable() {
        this.status = PolicyStatus.ENABLED;
        this.updatedAt = Instant.now();
    }

    public void disable() {
        this.status = PolicyStatus.DISABLED;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public PolicyType getPolicyType() {
        return policyType;
    }

    public String getCedarText() {
        return cedarText;
    }

    public PolicyStatus getStatus() {
        return status;
    }

    public int getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

