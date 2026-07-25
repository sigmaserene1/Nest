import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) {
      navigate({ to: "/auth" });
    }
  }, [isConnected, isConnecting, isReconnecting, navigate]);

  return <Outlet />;
}
