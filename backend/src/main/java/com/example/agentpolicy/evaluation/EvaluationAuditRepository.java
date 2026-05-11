package com.example.agentpolicy.evaluation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EvaluationAuditRepository extends JpaRepository<EvaluationAudit, UUID> {
}

