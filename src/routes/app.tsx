import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useNestScope } from "@/lib/nest-store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();
  useNestScope();


  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) {
      navigate({ to: "/auth" });
    }
  }, [isConnected, isConnecting, isReconnecting, navigate]);

  return <Outlet />;
}
