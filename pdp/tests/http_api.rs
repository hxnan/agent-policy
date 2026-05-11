use agent_policy_pdp::{app, Decision, EvaluationResponse};
use axum::{
    body::{to_bytes, Body},
    http::{Request, StatusCode},
};
use tower::ServiceExt;

#[tokio::test]
async fn post_evaluate_returns_allow_decision() {
    let request_body = serde_json::json!({
        "policies": [r#"permit(
  principal == User::"Alice",
  action == Action::"view",
  resource == Photo::"alice_photo"
);"#],
        "principal": r#"User::"Alice""#,
        "action": r#"Action::"view""#,
        "resource": r#"Photo::"alice_photo""#,
        "context": {},
        "entities": []
    });

    let response = app()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/evaluate")
                .header("content-type", "application/json")
                .body(Body::from(request_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let bytes = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: EvaluationResponse = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(body.decision, Decision::Allow);
}
