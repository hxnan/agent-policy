use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use cedar_policy::{
    Authorizer, Context, Decision as CedarDecision, Entities, EntityUid, PolicySet, Request,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EvaluationRequest {
    pub policies: Vec<String>,
    pub principal: String,
    pub action: String,
    pub resource: String,
    pub context: Value,
    pub entities: Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub enum Decision {
    Allow,
    Deny,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct EvaluationResponse {
    pub decision: Decision,
    pub matched_policies: Vec<String>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

pub fn app() -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/evaluate", post(evaluate_handler))
}

async fn evaluate_handler(Json(request): Json<EvaluationRequest>) -> impl IntoResponse {
    match evaluate(request) {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(error) => (StatusCode::BAD_REQUEST, Json(ErrorResponse { error })).into_response(),
    }
}

pub fn evaluate(request: EvaluationRequest) -> Result<EvaluationResponse, String> {
    let policy_src = request.policies.join("\n");
    let policy_set: PolicySet = policy_src
        .parse()
        .map_err(|err| format!("Failed to parse Cedar policies: {err}"))?;

    let principal: EntityUid = request
        .principal
        .parse()
        .map_err(|err| format!("Failed to parse principal: {err}"))?;
    let action: EntityUid = request
        .action
        .parse()
        .map_err(|err| format!("Failed to parse action: {err}"))?;
    let resource: EntityUid = request
        .resource
        .parse()
        .map_err(|err| format!("Failed to parse resource: {err}"))?;
    let context = Context::from_json_value(request.context, None)
        .map_err(|err| format!("Failed to parse context: {err}"))?;
    let cedar_request = Request::new(principal, action, resource, context, None)
        .map_err(|err| format!("Failed to build Cedar request: {err}"))?;
    let entities = Entities::from_json_value(request.entities, None)
        .map_err(|err| format!("Failed to parse entities: {err}"))?;

    let response = Authorizer::new().is_authorized(&cedar_request, &policy_set, &entities);

    Ok(EvaluationResponse {
        decision: match response.decision() {
            CedarDecision::Allow => Decision::Allow,
            CedarDecision::Deny => Decision::Deny,
        },
        matched_policies: response
            .diagnostics()
            .reason()
            .map(|policy_id| policy_id.to_string())
            .collect(),
        errors: response
            .diagnostics()
            .errors()
            .map(|error| error.to_string())
            .collect(),
    })
}
