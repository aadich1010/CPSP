-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 17: fetched with an id-offset (71) to skip repeats directly.
-- All 100 rows were genuinely new; 93 reclassified, 7 left as
-- 'Medicine' (6 genuine clinical case-vignettes + 1 more corrupted
-- source row, id b8a871a8-fadc-4aad-905d-ef02a0400c65, flagged for
-- admin review).
-- Running total: 1154 of 1705 processed (by DB count), 551 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Pathology' where id in (
'acdaa01b-1a47-4696-9bf6-1c50c61be605','acf8ad15-007b-4dff-a934-99756fb8c4c6','ae2c4360-1fba-4330-a527-435fa837fe80','af55fce2-85ab-4a2c-a83d-a8feaf6fa9fd','afe4f979-b4d6-43fe-83b3-bf82a906e06e','b0678434-bbe3-4d7e-ac5c-f99d1f2a420b','b1c7d820-4197-48f5-ba53-b370f7efff92','b267bf14-40ae-43ce-9e08-956262f47088','b2d10fd1-1109-4825-b19e-45136631dd71','b4016cd9-6ac6-4a53-b95c-c6e6629462d6','b47ede69-0f26-40f9-81af-73ac7724e065','b48ba986-6bc9-4e19-badc-a2b0234b9251','b59c3c7c-95b9-4d0b-bfd9-d85d078e82d1','b685f037-c9af-40f2-9c34-070fb31ba2a8','b6875ba4-ee7c-4109-b915-c350e4773ed4','b74c448c-71d4-46dc-aca8-9deb56c8130c','b7a557f3-d1d0-40e5-9482-a5f80edccce9','b827b6d0-f5db-4625-bb62-6d1f93013043','b95ad63c-997c-4643-8ba3-62875811bb22','ba5a1083-2d70-4bc5-a9ee-eeb9e724ec19'
);
update public.questions set subject = 'Applied Physiology' where id in (
'ace6f3ac-77f8-47af-9300-ecb6d1147d46','ace85759-a81a-4183-b73f-027e2a75a5bf','acf8382f-4a10-48d9-a5c0-4fdcd04199e7','ad0f8722-8e4c-461f-a689-f302c0e4932e','ae7b52d3-405f-4ab6-a990-fb24ca39fe92','af4774c9-265b-4ceb-83ac-36ae45109257','afbd9d73-0e87-4131-ba35-1909c6a73ba5','b116021d-e40b-4f63-a260-1d82c515d0c2','b1560e2a-cf4c-4a06-adf2-a90fd98b3ade','b1d997d2-b97c-4fe6-97c5-4abfc0095adc','b1ff6c1d-d09b-449d-891a-6d5db5b68454','b379313c-ff1e-4525-8332-4ff4f440d7bd','b39032b7-a7d6-43be-94de-b06ad99018e5','b3e84c03-6920-4711-8744-112c2e1f5717','b45cd88b-6611-4abc-8d2a-a847b2997183','b65a033b-5ac3-4e11-af0f-35dd0f9d7b2e','b6b12673-4fb5-4752-bfbe-3cabf57b157f','b7400262-e18d-4db6-bf97-9bdea263c0df','b813a0e7-6c86-48e8-ab76-412ba331def6','b83254e6-00a2-496d-a7db-ea0ee39ad658','bb712966-a6a0-4677-8bb6-f2af4b5033f2','bbb854b1-6c72-4ad4-bc3d-8b6815d75169'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'ad984b22-d1b8-4c9e-a96f-988bcabbd233','ada57293-6571-4318-96ee-ace4e7d632d5','adb3dff8-71e1-4d14-8eef-911e3cd32db7','ae6430fa-dbd4-4ff6-bb98-809efd87d9df','aee84ad5-d1e8-4e9a-9b21-7cf3b24ee849','b0030594-f006-4a04-bf0c-131c4f481363','b0e09c6a-4033-4c92-81f4-3ce79b13dcfd','b3691c42-e635-4e3a-9581-2968822bab70','b4fef3c2-6058-45c0-99ca-fda5259993a5','b5799306-3710-4e60-8d5d-0e219880e90d','b5c5dc43-f1aa-42c3-9038-4e3993266700','b6069229-c51c-43ca-ae8e-0a586eedfcbb','b64a4a34-d36c-4428-9f2b-a91ea0969d0b','b686b5f8-ce69-47a3-864f-86375b060640','b740412c-4f05-4925-917e-e10abeb26f8e','b8fd3bd3-c128-4369-a625-761861277bc3','b91bf94c-feec-4233-b022-629299c210b9','b9ddba7c-5fdc-4b66-9b14-97b39ad68c17','baa6e987-3b09-4771-8f79-b2e75eacca21','bc021e68-5e6d-4af9-bc6f-2180c45a9bb2'
);
update public.questions set subject = 'Microbiology' where id in (
'afbe1b53-f46d-41a6-b60c-eb3899ce0947','b098cf05-e0d5-4eb0-92c8-93348bf9a5e7','b1aeded6-239a-45b9-b90b-d79e05eea304','b3904413-ebcd-4085-871d-4587f9f26392','b3fa8db1-bc11-46db-a28d-3a6585d45309','b52e2ec0-b5f9-4e47-9c65-e378da911ffa','b60f0ed6-a3ee-4431-ae8a-7d7cfb28395b','b6c4be1e-37b9-4994-8f1c-61b1e9b0a161','b6e18dd4-2b07-4a69-8d4b-280b06a1bdb4','b8a1e02a-fdf8-4839-b914-8c9e36df1b94'
);
update public.questions set subject = 'Applied Biochemistry' where id in ('ae53478d-a7a1-4b39-8212-620bb365fbf5','b098dba7-d63d-4eda-abb4-89db1c01a254','b22843fd-d049-4ba6-a06e-4554a3ab7b76','b73a2ad5-8980-4c71-8eb7-d8da41a95ee0','b811f09f-52fa-4992-b0c5-4d9fe12616e2','b8ad2538-6a1d-4398-8f0d-a027fdb81b26','b9b3e3cf-8181-459f-a075-b20515ce70bc');
update public.questions set subject = 'Immunology' where id in ('b26818f0-6f47-459a-a78e-f3cfdeac5868','b2b62078-5797-4cd2-bb72-fef384d96b5d','b8ec8685-26a0-43ad-b252-db7a676c3636');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('ae163bb0-98e2-4e1f-8ece-e03dbc5d7937','b0662612-0bcb-44e8-bf73-29ce7b0572f1');
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('ae819400-9791-45af-b2eb-8e0dcfff54d9');
update public.questions set subject = 'Anesthesia' where id in ('aeb08dd5-251c-4644-8ac0-760c9937414a','b9a4ea2e-1b46-4af6-8aa6-5914422c5859');
update public.questions set subject = 'Pediatrics' where id in ('b8a0060f-d468-493f-8f07-b8bd81915223');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('b80b38e7-be29-42da-99d7-b7b287d00f3a');
update public.questions set subject = 'Applied Pharmacology' where id in ('b7f5d588-6b22-4794-ada8-fa26e5c309e1','bb0bf69a-0220-439e-826a-2d1177fb2df8','bb7606db-27ef-4533-8234-91c4f5c4a909');
update public.questions set subject = 'Ophthalmology' where id in ('b5d890e0-5e7c-4160-a2de-87c01cefa3c2');
