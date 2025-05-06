import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para nuestras tablas
export type User = {
  id: string;
  address: string;
  username: string | null;
  created_at: string;
};

export type StakingInfo = {
  id: string;
  user_id: string;
  staked_amount: number;
  last_claim_timestamp: string;
  created_at: string;
};

// Función para obtener un usuario por su dirección de wallet
export async function getUserByAddress(address: string): Promise<User | null> {
  try {
    // Cambiado de .single() a .maybeSingle() para evitar errores cuando no hay resultados
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("address", address)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserByAddress:", error);
    return null;
  }
}

// Función para crear un usuario
export async function createUser(address: string, username: string = ""): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          address: address,
          username: username || null,
        },
      ])
      .select()
      .maybeSingle(); // Cambiado a maybeSingle()

    if (error) {
      // Si el error es porque el usuario ya existe, intentamos obtenerlo
      if (error.code === "23505") {
        return getUserByAddress(address);
      }
      console.error("Error creating user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createUser:", error);
    return null;
  }
}

// Función para actualizar el username
export async function updateUsername(userId: string, username: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", userId);

    if (error) {
      console.error("Error updating username:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in updateUsername:", error);
    return false;
  }
}