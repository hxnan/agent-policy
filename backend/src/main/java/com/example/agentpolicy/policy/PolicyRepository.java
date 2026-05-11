package com.example.agentpolicy.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PolicyRepository extends JpaRepository<Policy, UUID> {

    List<Policy> findByStatus(PolicyStatus status);
}
