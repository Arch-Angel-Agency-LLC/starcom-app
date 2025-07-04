# End-to-End (E2E) Test Case Specification

**Version:** 1.0
**Date:** 2025-07-02

## 1. Introduction

This document specifies the initial set of end-to-end test cases to be implemented using the Playwright Human-Simulation Framework. These tests cover the most critical user workflows.

---

## 2. Test Cases

### **Test Case ID: E2E-001**

- **Title:** Core Workflow - Send and Verify Public Message
- **Priority:** Critical
- **Objective:** To verify that a user can successfully join a team, send a message, and see it appear in the UI.

- **Steps:**
  1. Navigate to the application's base URL.
  2. Use `humanLikeClick` to click the element that allows a user to join a team (e.g., `button:has-text('Join Team')`).
  3. Verify that a confirmation of joining the team is visible.
  4. Use `humanLikeType` to enter a unique, timestamped message into the primary message input field.
  5. Use `humanLikeClick` to click the "Send" button.
  6. Wait for the message list to update.

- **Expected Result:**
  - The new message, containing the exact text typed in step 4, must be visible in the message history/log area.

---

### **Test Case ID: E2E-002**

- **Title:** UI State - Disabled Send Button
- **Priority:** High
- **Objective:** To ensure the "Send" button is disabled when the message input is empty and enabled when it has text.

- **Steps:**
  1. Navigate to the application and join a team.
  2. Verify that the "Send" button is initially disabled (`expect(button).toBeDisabled()`).
  3. Use `humanLikeType` to enter text into the message input.
  4. Verify that the "Send" button is now enabled (`expect(button).toBeEnabled()`).
  5. Clear the text from the message input.
  6. Verify that the "Send" button is disabled again.

- **Expected Result:**
  - The "Send" button's `disabled` state correctly reflects the presence of text in the message input field.

---

### **Test Case ID: E2E-003**

- **Title:** Channel Switching and State Preservation
- **Priority:** Medium
- **Objective:** To verify that the application correctly displays messages for different channels when the user switches between them.

- **Steps:**
  1. Navigate to the application and join a team.
  2. Send a unique message, "Message for Channel A", in the default channel.
  3. Verify "Message for Channel A" is visible.
  4. Simulate clicking on a different channel, "Channel B".
  5. Verify that "Message for Channel A" is **not** visible.
  6. Send a new unique message, "Message for Channel B".
  7. Verify "Message for Channel B" is visible.
  8. Switch back to "Channel A".

- **Expected Result:**
  - "Message for Channel A" should be visible again.
  - "Message for Channel B" should **not** be visible.
