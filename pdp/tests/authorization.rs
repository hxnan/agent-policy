use agent_policy_pdp::{evaluate, Decision, EvaluationRequest};

#[test]
fn allows_request_when_cedar_policy_permits_it() {
    let request = EvaluationRequest {
        policies: vec![r#"permit(
  principal == User::"Alice",
  action == Action::"view",
  resource == Photo::"alice_photo"
);"#
        .to_string()],
        principal: r#"User::"Alice""#.to_string(),
        action: r#"Action::"view""#.to_string(),
        resource: r#"Photo::"alice_photo""#.to_string(),
        context: serde_json::json!({}),
        entities: serde_json::json!([]),
    };

    let response = evaluate(request).expect("evaluation should succeed");

    assert_eq!(response.decision, Decision::Allow);
}

#[test]
fn denies_request_when_no_policy_permits_it() {
    let request = EvaluationRequest {
        policies: vec![r#"permit(
  principal == User::"Alice",
  action == Action::"view",
  resource == Photo::"alice_photo"
);"#
        .to_string()],
        principal: r#"User::"Bob""#.to_string(),
        action: r#"Action::"view""#.to_string(),
        resource: r#"Photo::"alice_photo""#.to_string(),
        context: serde_json::json!({}),
        entities: serde_json::json!([]),
    };

    let response = evaluate(request).expect("evaluation should succeed");

    assert_eq!(response.decision, Decision::Deny);
    assert!(response.matched_policies.is_empty());
}
