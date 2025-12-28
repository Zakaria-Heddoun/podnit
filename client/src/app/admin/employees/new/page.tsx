"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/hooks/use-toast";

export default function NewEmployeePage() {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast({
        title: "Validation error",
        description: "Name, email and password are required",
      });
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/admin/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role_id: roleId, password }),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create employee");
      }

      toast({ title: "Employee created", description: "The employee account was created successfully." });

      // clear form
      setName("");
      setEmail("");
      setPassword("");
      setRoleId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = data?.data || data || [];
        if (mounted) {
          setAvailableRoles(Array.isArray(list) ? list : []);
          if (Array.isArray(list) && list.length > 0) setRoleId(String(list[0].id));
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create Employee</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            value={roleId ?? ""}
            onChange={(e) => setRoleId(e.target.value || null)}
            className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm bg-transparent"
          >
            <option value="">(none)</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Enter a secure password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 ${
              loading ? "opacity-60 cursor-wait" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Employee"}
          </button>

          <Button variant="outline" onClick={() => { setName(""); setEmail(""); setPassword(""); setRoleId(null); }}>
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
