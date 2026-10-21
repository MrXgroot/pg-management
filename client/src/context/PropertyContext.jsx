import { createContext, useContext, useState, useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "../shared/constants.js";

export const PropertyContext = createContext(null);

function getSafelyStoredPropertyId() {
  try {
    return typeof window !== "undefined"
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PROPERTY_ID) || null
      : null;
  } catch {
    return null;
  }
}

function persistStoredPropertyId(propertyId) {
  try {
    if (typeof window === "undefined") return;
    if (propertyId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PROPERTY_ID, propertyId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SELECTED_PROPERTY_ID);
    }
  } catch {
    // Gracefully handle browser storage quota or security restrictions
  }
}

export function PropertyProvider({ children, initialProperties = [] }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    getSafelyStoredPropertyId,
  );

  useEffect(() => {
    if (!Array.isArray(initialProperties) || initialProperties.length === 0) {
      return;
    }

    const matchedProperty = initialProperties.find(
      (property) => property?.id === selectedPropertyId,
    );

    if (!matchedProperty) {
      const fallbackId = initialProperties[0]?.id ?? null;
      setSelectedPropertyId(fallbackId);
      persistStoredPropertyId(fallbackId);
    }
  }, [initialProperties, selectedPropertyId]);

  function selectProperty(propertyId) {
    setSelectedPropertyId(propertyId);
    persistStoredPropertyId(propertyId);
  }

  const value = {
    selectedPropertyId,
    selectProperty,
    isPropertySelected: Boolean(selectedPropertyId),
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
}
