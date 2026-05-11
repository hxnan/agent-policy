use std::net::SocketAddr;

use agent_policy_pdp::app;

#[tokio::main]
async fn main() {
    let addr: SocketAddr = std::env::var("PDP_BIND_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:8180".to_string())
        .parse()
        .expect("PDP_BIND_ADDR must be a valid socket address");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind PDP listener");

    axum::serve(listener, app())
        .await
        .expect("PDP server failed");
}
