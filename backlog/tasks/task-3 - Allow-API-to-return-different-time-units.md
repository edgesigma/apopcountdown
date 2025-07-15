---
id: task-3
title: Allow API to return different time units
status: To Do
assignee: []
created_date: '2025-07-14'
labels: []
dependencies:
  - task-2
---

## Description

Extend the countdown API to allow users to request the remaining time in different units (days, hours, minutes) via a query parameter.

## Acceptance Criteria

- [ ] The /api/v1/countdown endpoint accepts a 'unit' query parameter
- [ ] Valid units are 'days'
- [ ] 'hours'
- [ ] 'minutes'
- [ ] and 'seconds'
- [ ] The API returns the correct value for the specified unit
- [ ] The API returns a 400 error for invalid units
