export const instant = false;
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/session";

export default async function Home() {
  const id = await getWorkspaceId();
  redirect(id ? "/inbox" : "/login");
}
