# Agent Policy V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Java 21 + Maven backend and React + Ant Design frontend for policy CRUD and policy evaluation.

**Architecture:** Use a front-end/back-end split. The backend exposes REST APIs and isolates Cedar integration behind `PolicyEngine`; the frontend provides policy management, evaluation playground, and audit pages.

**Tech Stack:** Java 21, Maven, Spring Boot 3, Spring Data JPA, H2, Flyway, React, TypeScript, Vite, Ant Design, TanStack Query, Monaco Editor.

---

### Task 1: Backend Bootstrapping

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/example/agentpolicy/AgentPolicyApplication.java`
- Create: `backend/src/test/java/com/example/agentpolicy/AgentPolicyApplicationTests.java`

- [ ] Write a Spring Boot context-load test.
- [ ] Run `mvn test` in `backend` and verify it fails before the application class exists.
- [ ] Add the minimal Spring Boot application class.
- [ ] Run `mvn test` in `backend` and verify it passes.

### Task 2: Policy CRUD API

**Files:**
- Create backend domain, repository, service, controller, DTO, and tests under `backend/src/main/java/com/example/agentpolicy/policy` and `backend/src/test/java/com/example/agentpolicy/policy`.

- [ ] Write repository/service/controller tests for creating, listing, updating, deleting, enabling, and disabling policies.
- [ ] Implement minimal JPA entity and REST endpoints.
- [ ] Run `mvn test`.

### Task 3: Evaluation API

**Files:**
- Create backend engine and evaluation modules under `backend/src/main/java/com/example/agentpolicy/engine` and `backend/src/main/java/com/example/agentpolicy/evaluation`.

- [ ] Write tests for `AgentSession` request validation and Allow/Deny result mapping.
- [ ] Implement `PolicyEngine` interface and an initial Cedar-backed adapter.
- [ ] Implement evaluation audit persistence and REST API.
- [ ] Run `mvn test`.

### Task 4: Frontend Bootstrapping

**Files:**
- Create `frontend/package.json`, Vite config, React app shell, API client, and route structure.

- [ ] Create the Vite React app structure.
- [ ] Add Ant Design layout and route shell.
- [ ] Run `npm.cmd install` and `npm.cmd run build`.

### Task 5: Frontend Policy UI

**Files:**
- Create pages for policy list and policy editor under `frontend/src/pages`.

- [ ] Implement policy list with table actions.
- [ ] Implement policy editor with Monaco Cedar editor.
- [ ] Connect to backend policy APIs.
- [ ] Run frontend build.

### Task 6: Frontend Evaluation UI

**Files:**
- Create evaluation playground and audit pages under `frontend/src/pages`.

- [ ] Implement principal/action/resource form.
- [ ] Implement context/entities JSON editors.
- [ ] Show Allow/Deny, matched policies, and errors.
- [ ] Run frontend build and backend tests.

### Task 7: End-to-End Verification

**Files:**
- Update README or docs with run instructions.

- [ ] Run backend tests.
- [ ] Run frontend build.
- [ ] Start backend and frontend dev servers if needed.
- [ ] Verify policy CRUD and evaluation manually through the UI.
