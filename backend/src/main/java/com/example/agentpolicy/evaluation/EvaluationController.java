package com.example.agentpolicy.evaluation;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationService service;

    public EvaluationController(EvaluationService service) {
        this.service = service;
    }

    @PostMapping
    public EvaluationResponse evaluate(@Valid @RequestBody EvaluationRequest request) {
        return service.evaluate(request);
    }

    @GetMapping("/{id}")
    public EvaluationResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping
    public List<EvaluationResponse> list() {
        return service.list();
    }
}

