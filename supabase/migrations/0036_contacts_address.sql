-- =========================================================================
-- Contacts: a street address, so the contact list can open the person in a
-- maps app with one tap (a carer's house for a home visit or a foster
-- pick-up, a supplier's shop). Free text — whatever the person would type
-- into Google Maps themselves — since the shelter's contacts are a mix of
-- Thai village addresses, landmarks and shared map pins. No geocoding.
-- =========================================================================

alter table contacts add column if not exists address text;
