# TODOs

## Bug Fixes

- [x] Product Synchronization

  - [x] Fix products not updating in Supabase DB with Stripe fixtures
  - [x] Review sync logic and fixture implementation

- [ ] Development Scripts

  - [x] Clarify setup between `dev` and `bootstrap` commands
  - [x] Fix worker password authentication
  - [x] Add standardized default settings with user prompts

- [x] Supabase Container Issues
  - [x] Debug container errors
  - [x] Implement comprehensive error logging
  - [x] Document resolution steps

## Needs Testing

- [ ] Admin Panel Testing

  - [ ] Test role-based access control
  - [ ] Verify content management features
  - [ ] Validate user management functions

- [ ] Payment System Testing

  - [ ] Test successful payment flows
  - [ ] Validate error handling
  - [ ] Check subscription cancels
  - [ ] Verify webhook functionality

- [ ] Payment Email Verification

  - [ ] Review all email templates
  - [ ] Test payment confirmation emails
  - [ ] Verify subscription status emails

- [ ] Production Webhook Update
  - [ ] Sync webhook with sandbox configuration
  - [ ] Test webhook reliability
  - [ ] Document configuration changes

## Features

- [ ] Branding Implementation

  - [ ] Update visual identity
  - [ ] Apply consistent design system

- [ ] Front-end Reader

  - [ ] Build reading interface
  - [ ] Optimize performance metrics

- [ ] Admin Panel

  - [ ] Test new admin interface
  - [ ] Verify all CRUD operations

- [ ] Subscription System

  - [ ] Test payment processing
  - [ ] Validate subscription lifecycle

- [ ] Authentication

  - [ ] Add Google SSO
  - [ ] Remove GitHub auth
  - [ ] Streamline auth flow

- [ ] Podcast Integration

  - [ ] Review [podcast specification](../plans/podcast-spec.md)
  - [ ] Plan implementation phases
  - [ ] Set up audio infrastructure

- [ ] Knowledge Tree Integration

  - [ ] Review [k-tre specification](../plans/k-tre-spec.md)
  - [ ] Plan implementation phases
  - [ ] Set up graph infrastructure

- [ ] Error Monitoring

  - [ ] Review [Sentry implementation plan](../plans/sentry-plan.md)
  - [ ] Set up error tracking
  - [ ] Configure performance monitoring
  - [ ] Implement custom error boundaries
