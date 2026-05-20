"use client";

import { useEffect } from "react";

type ManageFormDraftControllerProps = {
  hasSuccessState: boolean;
  hasErrorState: boolean;
};

function getManagedForms() {
  return Array.from(document.querySelectorAll<HTMLFormElement>("form[data-draft-key]"));
}

function readDraftKey(form: HTMLFormElement) {
  return form.getAttribute("data-draft-key");
}

function saveDraft(form: HTMLFormElement) {
  const draftKey = readDraftKey(form);
  if (!draftKey) {
    return;
  }

  const values: Record<string, string> = {};
  Array.from(form.elements).forEach((element) => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) {
      return;
    }

    if (!element.name || element.type === "file") {
      return;
    }

    values[element.name] = element.value;
  });

  window.sessionStorage.setItem(draftKey, JSON.stringify(values));
}

function restoreDraft(form: HTMLFormElement) {
  const draftKey = readDraftKey(form);
  if (!draftKey) {
    return;
  }

  const rawDraft = window.sessionStorage.getItem(draftKey);
  if (!rawDraft) {
    return;
  }

  const values = JSON.parse(rawDraft) as Record<string, string>;
  Array.from(form.elements).forEach((element) => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) {
      return;
    }

    if (!element.name || element.type === "file" || !(element.name in values)) {
      return;
    }

    element.value = values[element.name] ?? "";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function clearDraft(form: HTMLFormElement) {
  const draftKey = readDraftKey(form);
  if (!draftKey) {
    return;
  }

  window.sessionStorage.removeItem(draftKey);
}

export function ManageFormDraftController({ hasSuccessState, hasErrorState }: ManageFormDraftControllerProps) {
  useEffect(() => {
    const forms = getManagedForms();
    const cleanups = forms.map((form) => {
      const handler = () => saveDraft(form);
      form.addEventListener("input", handler);
      form.addEventListener("change", handler);
      return () => {
        form.removeEventListener("input", handler);
        form.removeEventListener("change", handler);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (!hasErrorState) {
      return;
    }

    getManagedForms().forEach((form) => restoreDraft(form));
  }, [hasErrorState]);

  useEffect(() => {
    if (!hasSuccessState) {
      return;
    }

    const timer = window.setTimeout(() => {
      getManagedForms().forEach((form) => clearDraft(form));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [hasSuccessState]);

  return null;
}
