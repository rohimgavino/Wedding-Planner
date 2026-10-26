-- NOT an automatic migration. Reset recovery/QA approval required separately.
BEGIN;
GRANT EXECUTE ON FUNCTION public.reset_planning_content(uuid,text) TO authenticated;
COMMIT;
