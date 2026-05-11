package com.example.agentpolicy.policy;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class PolicyService {

    private final PolicyRepository repository;

    public PolicyService(PolicyRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PolicyResponse create(PolicyRequest request) {
        Policy policy = Policy.create(request.name(), request.description(), request.policyType(), request.cedarText());
        return PolicyResponse.from(repository.save(policy));
    }

    @Transactional(readOnly = true)
    public List<PolicyResponse> list() {
        return repository.findAll().stream()
                .map(PolicyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PolicyResponse get(UUID id) {
        return PolicyResponse.from(find(id));
    }

    @Transactional
    public PolicyResponse update(UUID id, PolicyRequest request) {
        Policy policy = find(id);
        policy.update(request.name(), request.description(), request.policyType(), request.cedarText());
        return PolicyResponse.from(policy);
    }

    @Transactional
    public PolicyResponse enable(UUID id) {
        Policy policy = find(id);
        policy.enable();
        return PolicyResponse.from(policy);
    }

    @Transactional
    public PolicyResponse disable(UUID id) {
        Policy policy = find(id);
        policy.disable();
        return PolicyResponse.from(policy);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found");
        }
        repository.deleteById(id);
    }

    private Policy find(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found"));
    }
}

