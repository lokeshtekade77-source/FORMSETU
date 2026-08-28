// Centralized Vault Data Synchronization Engine for FormSetu
import { VaultField } from "@/components/InfoVault";
import { FieldValueOut } from "./api";

const STORAGE_KEY = "formsetu_vault_fields";

export const DEFAULT_VAULT_RECORD_MAP: Record<string, string> = {};

export function getVaultFields(): VaultField[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveVaultFields(fields: VaultField[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
    window.dispatchEvent(new Event("formsetu_vault_updated"));
  } catch {
    // storage error
  }
}

export function getVaultValueMap(): Record<string, string> {
  const map = { ...DEFAULT_VAULT_RECORD_MAP };
  const vault = getVaultFields();

  vault.forEach((v) => {
    if (v.key && v.value && !v.value.includes("••")) {
      map[v.key.toLowerCase()] = v.value;

      // Add common key aliases
      if (v.key === "fullName") {
        map["full_name"] = v.value;
        map["applicant_name"] = v.value;
        map["candidate_name"] = v.value;
      } else if (v.key === "fatherName") {
        map["father_name"] = v.value;
        map["father_s_name"] = v.value;
      } else if (v.key === "motherName") {
        map["mother_name"] = v.value;
        map["mother_s_name"] = v.value;
      } else if (v.key === "dob") {
        map["date_of_birth"] = v.value;
        map["birth_date"] = v.value;
      } else if (v.key === "permanentAddress") {
        map["address"] = v.value;
        map["permanent_address"] = v.value;
        map["residential_address"] = v.value;
      } else if (v.key === "pinCode") {
        map["pin"] = v.value;
        map["pincode"] = v.value;
        map["postal_code"] = v.value;
      } else if (v.key === "degree") {
        map["qualification"] = v.value;
        map["course"] = v.value;
        map["graduation"] = v.value;
      } else if (v.key === "college") {
        map["university"] = v.value;
        map["institution"] = v.value;
      } else if (v.key === "accountNumber") {
        map["account_number"] = v.value;
        map["bank_account_number"] = v.value;
      }
    }
  });

  return map;
}

export function syncFormFieldsWithVault(formFields: FieldValueOut[]): FieldValueOut[] {
  const vaultMap = getVaultValueMap();

  return formFields.map((field) => {
    const cleanKey = field.key.toLowerCase().trim();
    let valToUse: string | undefined = undefined;

    // Check exact or key alias in vaultMap
    if (vaultMap[cleanKey]) {
      valToUse = vaultMap[cleanKey];
    } else {
      // Fuzzy key search
      for (const [vKey, vVal] of Object.entries(vaultMap)) {
        if (cleanKey.includes(vKey) || vKey.includes(cleanKey)) {
          valToUse = vVal;
          break;
        }
      }
    }

    if (valToUse) {
      return {
        ...field,
        value: valToUse,
        status: "confirmed",
        verified_by: "Information Vault Sync",
        source: "Information Vault Record"
      };
    }

    return field;
  });
}
