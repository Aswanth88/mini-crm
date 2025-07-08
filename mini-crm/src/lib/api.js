// src/lib/api.js

// Python Backend URL (change to your actual host if deployed)
const PYTHON_API_BASE = "http://localhost:8000";

// Supabase setup
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

////////////////////////
// 🔹 Lead Management
////////////////////////

export async function getLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createLead(lead) {
  const { data, error } = await supabase
    .from("leads")
    .insert([lead])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLeadStatus(id, newStatus) {
  const { data, error } = await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLead(id) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}

////////////////////////
// 🔹 OCR Upload (Python)
////////////////////////

export async function extractLeadFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${PYTHON_API_BASE}/ocr`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("OCR failed");
  return await res.json(); // { name, email }
}

////////////////////////
// 🔹 LLM Interaction (Python)
////////////////////////

export async function interactWithLLM(query, lead) {
  const res = await fetch(`${PYTHON_API_BASE}/llm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, lead }),
  });

  if (!res.ok) throw new Error("LLM interaction failed");
  return await res.json(); // { response: "...", actions: [...] }
}
