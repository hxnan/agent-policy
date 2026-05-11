package com.example.agentpolicy.policy;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    private final PolicyService service;

    public PolicyController(PolicyService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PolicyResponse create(@Valid @RequestBody PolicyRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<PolicyResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public PolicyResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    public PolicyResponse update(@PathVariable UUID id, @Valid @RequestBody PolicyRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/enable")
    public PolicyResponse enable(@PathVariable UUID id) {
        return service.enable(id);
    }

    @PostMapping("/{id}/disable")
    public PolicyResponse disable(@PathVariable UUID id) {
        return service.disable(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}

