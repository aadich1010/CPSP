-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 20: fetched with an id-offset (88) to skip repeats directly.
-- All 100 rows were genuinely new; 98 reclassified, 2 left as 'Medicine':
--   dc504ef2-199b-4310-a7f7-235c1eb67f56 (corrupted/mismatched source
--     data -- question stem asks about primary hyperaldosteronism but
--     the explanation describes Cushing syndrome; flagged for admin
--     review)
--   e20a5c58-e74c-44c8-8f4c-3141b110b3ad (genuine clinical case-vignette
--     -- dilated cardiomyopathy presentation, no clean specialty-bucket
--     fit)
-- Running total: 1442 of 1705 processed (by DB count), 263 remain
-- tagged 'Medicine'. Verified via count(*) = 263 (delta of 98 from the
-- prior 361, matching expectations exactly).

update public.questions set subject = 'Applied Physiology' where id in (
'd719c582-d520-4d16-95e8-ed751fcd8578','d71c0efe-a4f0-45be-bc20-511e05bfefd8','d7591ba9-69da-4ce8-9dc7-267eff43e345','d951509a-ab22-4539-b5ee-7eb27f72316d','d996ecad-9d7b-479b-b443-2526937d0bf3','d9b0f573-020c-4c0e-ae08-677217fa1861','d9bf2e46-2a67-4d86-b308-255e2f1e651a','d9e012eb-5bea-46e0-a080-f00d5e6ebc0e','db45fe99-e6a6-439e-9a33-ed4a74ab41ac','db6a376a-59b0-4c17-97b4-af52f26891dc','dc150785-cfe5-46d2-a22e-d425af5d8ccc','dc4cfe6f-1963-4af2-9590-da5fb77fc5aa','dc65507d-0c3c-4b5f-a978-9a5ceab21c30','dcdad014-2a24-46d2-91fd-de600e00de84','dd0ac840-11e9-4310-baca-33182a57f3ee','de7a144b-cb6b-44c5-aefc-b77ca946324c','deff42a2-8792-4006-8015-421c96410db5','df7eaa2f-7b5f-4a1e-a6fa-e96320000527','dfd03f8b-8f5c-4fb7-9da6-0a8f9d18e917','e160d2be-d9a2-4541-b82a-894d769f0da0','e1ed13f3-4de3-46c2-957b-144174f51afc','e24b942e-4795-4075-adcc-6b4c3558371f','e3104cc5-5e8c-4783-a081-52c5a87a763c','e335ffac-bf68-4430-9c01-81463c5d1b27','e3440d3d-5f40-477b-99c9-107398900130','e41e6586-e0ed-4e24-81f9-2c4ce2173ffe'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'd8bf7192-ac14-4e9f-886d-dc4866f4446e','d9466a50-0d33-4277-a7a8-68cc8e8a7538','db3f78af-2dbe-44dc-90cc-73fb94dd88b0','dd13b049-2da6-447c-b48f-f8bc4f5dd557','dd1775ea-caf0-4f8e-abf7-a2503b693c5b','dd5c7f92-3222-4924-80ef-a966a07ca8f3','e11ba1c0-c29e-4ab0-9263-6b6717bf4acc','e152d5b5-2f35-436c-b4c8-8d663f735658','e1542194-7002-4084-bb62-fb68c879b67c','e3034430-a911-4811-bfed-bc7388a02e33','e3161285-8b8e-4e0a-af94-64eb28cda74c','e3edbc29-0aed-4cff-8cc1-cf3fdb8d5601','e40b25ae-49ed-4ac4-a900-102eb390dbc4','e48a20f0-3557-46ed-b43b-6b4910c4e8d3','e4a832a3-0364-4caf-8bcc-f11aa039699c','e57e3ccd-6ffe-47ff-878d-a56e0138729b'
);
update public.questions set subject = 'Applied Pathology' where id in (
'd75ed026-0661-4968-8505-d8098e228cd6','d87cc5aa-0a50-47d0-b8b3-b3451aee2126','d8e26472-6744-4fa9-9809-adaedc4d5e17','d90a0258-4d05-4291-acc3-6610cf664a0a','d91980d8-fa94-45e8-8a14-62aa3a8ef2ab','da93f398-4b7f-48eb-9a8b-0bd2ff6dc85e','dbd0a894-06d9-43e1-a066-87f580b596fa','dc84cda1-5ec4-4bf0-806f-40a35d5e28fb','dcb46548-e813-469a-b798-98549e147ba9','dd0d4984-fbc3-4ff2-995c-5c4b9b63be87','ddbcf2d7-572e-49e8-8f81-eadaad47805a','de87622c-edec-484e-b8b8-730506c61721','de978cce-4833-4e47-b95e-35cdc5e63cc9','ded48588-fe13-463c-8e5d-ae483c7478af','defe5078-b810-44ef-849f-3096bc6a1543','e00efcac-cf6a-447c-ad30-437e27ab6230','e143d50e-e70b-496a-8b25-9b6378e4a1f8','e26d8899-57bf-461a-8161-3e5f02f21ba5','e3909403-224b-41ee-b4a2-40d4963aca19','e3fc3455-d2d1-48ee-a4d9-98f213c8bd8a','e4112ce1-3ba8-4944-8ae9-18a8d675ee40','e49f02f3-b5f5-420b-bd32-56a2bbb8b41d','e53f4822-17b6-48fd-8118-db15227666b1','e582120d-6d24-450a-bcee-f54b7acbfb99'
);
update public.questions set subject = 'Applied Pharmacology' where id in ('d7eb6b7e-b143-44d0-97a1-6073a8a58070','d8c3b182-d3ee-44cb-b25e-2d870346b7bf','df6561ab-121e-4a66-bd3e-c7134e31ece8','e328f5c2-effd-47e4-bc2e-ca350ad9bc8b','e3b8ad8d-72df-4310-b474-8aa2cd2a3c70','e445d3a6-2ca2-4861-96db-a028e041511f','e4ab3240-3831-4fbd-bdaa-d2f0b22dc9f0');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('d75450d9-ba31-484c-a1c1-86b1bb0a26c2','d7ee51a5-19e8-480e-b893-c8dda2ca6ca6','dadd509b-28ce-49be-b4f3-c8fec0ea6675','deca95cb-87e1-4344-89ba-3389500fca4e');
update public.questions set subject = 'Microbiology' where id in ('d72d833b-cd3c-4193-b796-bf1dadfe5c13','d9b0b2b0-e4ea-4bfd-82ae-05df5a7afd2d','dbd1da51-f07c-4c0b-8b1e-f222dd221745','dfd2f8dc-8204-4f69-9339-d4e2e22a8c9a');
update public.questions set subject = 'Community Medicine' where id in ('da7b6f43-4ee4-4204-bffb-63b58585d44e');
update public.questions set subject = 'Anesthesia' where id in ('dc08c15f-fc32-42b0-a705-01aff71b17bf','dcc3184b-4f73-484e-a478-cdf12942c525');
update public.questions set subject = 'Ophthalmology' where id in ('d7f58e66-96d3-43c8-a96d-b8fdab1e98ad','e309c6f7-136e-49bc-be21-8b857e783fcf','e3c5b577-77f0-4364-be5d-fea506660276');
update public.questions set subject = 'Immunology' where id in ('de6d92ee-c5d3-4c6d-90b9-60c2eb31fd5f','df830b48-7024-46ce-b2fd-d5176193faa1');
update public.questions set subject = 'Pediatrics' where id in ('df59d113-63cf-475f-80c9-a3f6dbeab607','e4d5545f-537c-4234-9dc7-91d82bfc15d9');
update public.questions set subject = 'Emergency Medicine / Critical Care Basics' where id in ('dca99418-14e6-4d6b-b269-373ce37bb87b');
update public.questions set subject = 'General Surgery' where id in ('de9e04b9-5029-47ee-9ec1-fd983b5e7116');
update public.questions set subject = 'Applied Biochemistry' where id in ('e57c1126-6de6-4255-ac6f-54b232795560');
update public.questions set subject = 'ENT' where id in ('d7747ec8-5b1d-4bc8-b5b7-31efc724d5be','e4be2102-5e19-4ce4-a507-f1071be8d887');
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('e2d2eb03-7593-452b-a31f-48078824e142');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('d91e0284-b527-4170-926b-d4ba497bb5eb');
