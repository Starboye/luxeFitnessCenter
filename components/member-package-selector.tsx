"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type PackageOption = {
  id: string;
  name: string;
  duration_days: number;
  price: number | string;
  active: boolean;
};

type PackagePlanConfig = {
  label: string;
  days: number;
  price: number;
};

type PackageCategoryConfig = {
  label: string;
  keywords: string[];
  plans: PackagePlanConfig[];
};

const PACKAGE_CATALOG: PackageCategoryConfig[] = [
  {
    label: "50+ Age Group Strength Training Plans",
    keywords: ["50", "age group", "senior"],
    plans: [
      { label: "Monthly", days: 30, price: 1499 },
      { label: "Quarterly", days: 90, price: 3999 },
      { label: "Half-Yearly", days: 183, price: 6666 },
      { label: "Yearly", days: 365, price: 9999 }
    ]
  },
  {
    label: "Student Plans Strength Training Plans",
    keywords: ["student"],
    plans: [
      { label: "Monthly", days: 30, price: 1499 },
      { label: "Quarterly", days: 90, price: 3999 },
      { label: "Half-Yearly", days: 183, price: 6666 },
      { label: "Yearly", days: 365, price: 9999 }
    ]
  },
  {
    label: "Strength + Cardio Training",
    keywords: ["strength cardio", "strength + cardio", "strength and cardio", "cardio"],
    plans: [
      { label: "Monthly", days: 30, price: 2999 },
      { label: "Quarterly", days: 90, price: 5999 },
      { label: "Half-Yearly", days: 183, price: 7999 },
      { label: "Yearly", days: 365, price: 13999 }
    ]
  },
  {
    label: "Personal Training",
    keywords: ["personal training", "1 on 1", "1-on-1"],
    plans: [
      { label: "Basic", days: 15, price: 5999 },
      { label: "Premium", days: 20, price: 9999 }
    ]
  }
];

function normalizeValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesCategory(pkg: PackageOption, category: PackageCategoryConfig, plan: PackagePlanConfig) {
  const normalizedName = normalizeValue(pkg.name);
  const numericPrice = Number(pkg.price);

  return (
    pkg.active &&
    pkg.duration_days === plan.days &&
    numericPrice === plan.price &&
    category.keywords.some((keyword) => normalizedName.includes(normalizeValue(keyword)))
  );
}

function getPackageVariantName(groupLabel: string, planLabel: string) {
  return `${groupLabel} - ${planLabel}`;
}

export function MemberPackageSelector({ packages }: { packages: PackageOption[] }) {
  const packageGroups = useMemo(
    () =>
      PACKAGE_CATALOG.map((category) => ({
        ...category,
        plans: category.plans.map((plan) => ({
          ...plan,
          packageOption: packages.find((pkg) => matchesCategory(pkg, category, plan)) ?? null
        }))
      })),
    [packages]
  );

  const initialGroupLabel = packageGroups[0]?.label ?? "";
  const [selectedGroupLabel, setSelectedGroupLabel] = useState(initialGroupLabel);

  const selectedGroup = packageGroups.find((group) => group.label === selectedGroupLabel) ?? packageGroups[0] ?? null;
  const firstAvailablePlanLabel = selectedGroup?.plans[0]?.label ?? "";

  const [selectedPlanLabel, setSelectedPlanLabel] = useState(firstAvailablePlanLabel);

  useEffect(() => {
    setSelectedGroupLabel(initialGroupLabel);
  }, [initialGroupLabel]);

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedPlanLabel("");
      return;
    }

    const currentPlanStillValid = selectedGroup.plans.some((plan) => plan.label === selectedPlanLabel);
    if (currentPlanStillValid) {
      return;
    }

    setSelectedPlanLabel(firstAvailablePlanLabel);
  }, [firstAvailablePlanLabel, selectedGroup, selectedPlanLabel]);

  const selectedPlan = selectedGroup?.plans.find((plan) => plan.label === selectedPlanLabel) ?? null;
  const selectedPackage = selectedPlan?.packageOption ?? null;
  const packageVariantName = selectedGroup && selectedPlan ? getPackageVariantName(selectedGroup.label, selectedPlan.label) : "";
  const [dueAmount, setDueAmount] = useState("0");

  useEffect(() => {
    setDueAmount("0");
  }, [selectedPlan?.label, selectedGroup?.label]);

  return (
    <>
      <input type="hidden" name="packageId" value={selectedPackage?.id ?? ""} />
      <input type="hidden" name="packageName" value={packageVariantName} />
      <input type="hidden" name="packageDurationDays" value={selectedPlan ? String(selectedPlan.days) : ""} />
      <input type="hidden" name="packagePrice" value={selectedPlan ? String(selectedPlan.price) : ""} />

      <label style={fieldLabelStyle}>
        Select gym package
        <select
          value={selectedGroupLabel}
          onChange={(event) => setSelectedGroupLabel(event.target.value)}
          required
          style={inputStyle}
        >
          <option value="" disabled>
            Select gym package
          </option>
          {packageGroups.map((group) => (
            <option key={group.label} value={group.label}>
              {group.label}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldLabelStyle}>
        Plans
        <select
          value={selectedPlanLabel}
          onChange={(event) => setSelectedPlanLabel(event.target.value)}
          required
          disabled={!selectedGroup}
          style={inputStyle}
        >
          <option value="" disabled>
            Plans
          </option>
          {(selectedGroup?.plans ?? []).map((plan) => (
            <option key={plan.label} value={plan.label}>
              {plan.label}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldLabelStyle}>
        Duration in days
        <input
          value={selectedPlan ? String(selectedPlan.days) : ""}
          readOnly
          placeholder="Duration in days"
          aria-label="Duration in days"
          style={readOnlyInputStyle}
        />
      </label>

      <label style={fieldLabelStyle}>
        Preset price
        <input
          value={selectedPlan ? `Rs ${selectedPlan.price.toFixed(2)}` : ""}
          readOnly
          placeholder="Preset price"
          aria-label="Preset price"
          style={readOnlyInputStyle}
        />
      </label>

      <label style={fieldLabelStyle}>
        Due amount
        <input name="dueAmount" type="number" step="0.01" min="0" value={dueAmount} onChange={(event) => setDueAmount(event.target.value)} placeholder="Due amount" required style={inputStyle} />
      </label>
    </>
  );
}

const fieldLabelStyle: CSSProperties = {
  display: "grid",
  gap: "0.45rem",
  color: "#cfcfcf",
  fontSize: 13,
  fontWeight: 700
};

const inputStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#090909",
  color: "white",
  padding: "0.92rem 1rem"
};

const readOnlyInputStyle: CSSProperties = {
  ...inputStyle,
  color: "#d4d4d4",
  background: "#101010"
};
