-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 4 (100 questions): 96 reclassified, 4 left tagged 'Medicine' (3
-- genuine clinical vignettes + 1 with corrupted/garbled source text that
-- couldn't be classified at all -- flagged for the admin to review/fix in
-- the question bank directly).
-- Running total: 400 of 1705 processed, 1335 remain tagged 'Medicine'.

update public.questions set subject = 'Applied Biochemistry' where id in (
'2e5de248-35b8-4752-8f07-85bb32de084e','313e7d97-f6da-444b-b21a-a2abaa052c1a','32ddf002-74af-45ca-ada2-c305610b5807','36371155-6ec6-415c-bf2c-a001f0112947','369d825e-6c74-454f-a20f-a78e178d1e66','3731903f-d3a5-46f9-9674-b467657c80b9','3936a406-4c66-4e32-a242-3583f1c71d43','3b154f0a-8b36-4ec0-add4-f9e106389dfa'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'2e634e78-f56f-4697-9124-99022719bd1e','32b832d9-61be-4b7c-8cc7-d032e4c7bcc6','343dcda2-b2db-4ffc-b6c5-5058c1f2e46f','36baaa43-c763-482f-8f86-be7324fba308','36c33610-82f4-43c7-bb4c-83ed209898c9','36f3aaa3-c217-434d-80b1-ff4817deb7b2','380f7641-3da5-46ad-abac-27fc755991d4','383e93d8-1afe-455c-a680-60a6fe3caed3','3855b8f0-e1f4-4e5b-8df8-cfad5a579fbd','39216977-db48-4c68-946e-00cea915d77f','395268bf-e372-4b71-82ba-aed3b9018158','3a7efefd-c7b4-4ae1-9c30-9376d1d83ae2','3b045d56-c280-4bf1-845c-31848b74001a','3ba5c8f9-0251-41ad-bc48-0fc17c7a2617'
);
update public.questions set subject = 'Applied Physiology' where id in (
'2f2e7dd3-21ba-44ad-a651-60b0bdb5a3fa','2fe13380-8d69-464f-b39d-ecb5b3f74ae7','2ff814c7-d2ec-441b-a78b-b916b486620a','3012df72-0985-4ccf-85ad-787ae0872fc0','30460b48-0f2a-43b0-bdb5-e14bb32c6288','30a234a7-53d7-4ece-893f-e19622e08160','30f80e29-c1a0-4cf9-a7e3-b5f0c5f78c5d','30fbb362-d453-4484-b821-16012a020e7d','320863c5-57d2-4df4-b228-33dfc43567be','3228f34b-6a29-4649-882b-2b8c70486a30','3369ecf9-0ec5-45de-9c91-0f89b8c9667d','33c15541-45cf-4477-a050-542cc4692c6b','33f060f4-db74-4aa6-b8ba-38d4d397edf1','344c5759-2bef-4ed0-855e-2b40d46d5751','344e1479-c13a-48f5-80f1-2031af2256c0','354b4f06-5ae6-4c46-90d8-91e663b00226','3726c96d-1d52-4179-91ee-bda69f17006f','37846d46-0eb6-456d-855c-92f5c0e53c2c','3791099c-2321-4412-8ee1-c1b3fdb66823','3791d2b1-f709-43e5-9e47-cb63ee46fb97','381445f1-2f2d-4e20-bd81-659ed173f434','38859799-76a2-4d81-8097-bd99b7272b96','3954bae1-5d3b-416d-ab92-04a96a93fd0f','39aec3b6-f237-4d7f-a61b-ee39f400350f','39d29fa8-8630-4068-a027-3293098b47f6','3a7528da-dc16-492a-a075-47975d74ee0e','3b5da3ed-13ec-4e90-b633-86c493b6f6c1','3b9de1d5-6b1d-4536-b52b-9bb2e39aad1b','3b9f1eed-9946-47c5-8c21-7417f4b85120'
);
update public.questions set subject = 'Applied Pathology' where id in (
'2ecb5d5f-9acd-4a44-872a-3a24a26f031d','2f1904bc-6311-47af-947d-b4b87ce425fb','30cd71cb-979a-47ad-b70f-01c026e63173','31ab8b4b-db8e-4767-9627-00b9a0fbdbba','31ec21eb-ba70-4e8d-bd20-ae37b9d15918','31f8065c-beb3-45ef-becf-c26bccc1baf2','32e4a04e-2e87-4b0a-a2ca-7b5899f93c37','33f88af6-4f09-4494-a367-597196ab47cd','33fe1957-9f31-4cb5-988e-115cbc0aa1ae','34c19b5d-8c60-4f8a-b08b-4f55f85967c2','34e92532-6e8b-4ba5-b850-ceca668bc90c','35ad3d9c-d961-4537-a317-72db829442a4','3a0c6ec0-ef0f-47f0-aa48-8d0337dbbe4c','3a2a6188-ad75-4ffc-8d6f-2f83f4608e6d','3a56fce8-ad5a-4ed5-9348-3245e0a502f8','3ad14763-2727-41bf-8af4-4b4119c57d9e','3b16ba03-4c3a-4a61-b120-f597ba1ed6ef','3bf2375a-be19-4b00-81a6-b4dab6a1a97a'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'3257e1b2-a8f3-4b51-9f95-83c12646dc99','37a1d90f-7bc0-4b2b-afec-b2ee4629e98f','37baaf7c-c7e0-4b6c-9ea6-3048f2d1df3f','37da9556-b557-4344-876e-8b743bf3586f','3a760462-a32e-4bd9-af8e-e638a717fac4','3b10e987-b39f-44e4-b36f-00a96e9db7c0','3b9d7e08-0135-4d4b-bb4d-c19118383fcf','3bbf1c5f-5c9b-426b-9ebf-86116beb07fc','3c26a2c7-4acb-4bfd-a751-c303e2653df8'
);
update public.questions set subject = 'Immunology' where id in (
'30198528-5fa3-4374-a3c9-b5362b2e10aa','30a93530-9d6c-4698-b159-e3c7f17e1ccb','32b6459a-af4a-4dfb-9074-b0f867b143ed','36c988f5-031b-401b-aeb1-2d6eb0c54126','3745ff64-9999-41bc-b98d-1d63f78ef4af','37965550-92fa-4c99-8d65-2b8830bdda10','385d449c-e7c5-444f-bb76-3f95013d62c0'
);
update public.questions set subject = 'Microbiology' where id in (
'3341e7d7-0920-4526-a99c-542cdf18a65f','38102c23-19e3-42c7-98a0-86f3993dbadd','38700fac-2ff2-40c7-b38b-a4dd9ee4efe0','396ae54b-caf4-4bc6-912b-b003fd1314ce'
);
update public.questions set subject = 'Behavioral Sciences' where id in ('30c654d4-f350-4166-939b-d161a4f7c07b');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('30e946b2-ace9-4fd0-b93b-a136ce6a4de7');
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('35eaab15-f891-4ebc-96e3-4e605b2cd038');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('36934735-869a-4786-8928-2dfb62d2bb13');
update public.questions set subject = 'Community Medicine' where id in ('36b9360c-89c3-48b0-a8e8-5d2e083d6e18','3bc3e6d2-9548-4bac-acbd-5c89c9f67c4f');
update public.questions set subject = 'Ophthalmology' where id in ('37e61555-78d6-43d2-80e5-89990dff1fe6');
