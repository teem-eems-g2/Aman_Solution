import { redirect } from "next/navigation";

export default function BookRepairPage() {
  redirect("/customer/dashboard?tab=book");
}
