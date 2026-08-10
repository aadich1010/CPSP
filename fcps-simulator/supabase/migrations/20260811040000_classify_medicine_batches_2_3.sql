-- ═══════════════════════════════════════════════════════════════════════════
-- Continuation of the 'Medicine' subject-classification pass (see
-- 20260811030000_pilot_classify_medicine_subjects.sql for the pilot batch
-- and full methodology). Same rules: each question's actual text +
-- explanation read individually, genuine clinical case-vignettes left
-- tagged 'Medicine' rather than force-assigned, questions that actually fit
-- an existing card (Immunology/Microbiology/Epidemiology & Biostatistics/
-- Dermatology/Community Medicine/Anesthesia) routed there instead of one of
-- the five new 'Applied X' buckets.
--
-- Batch 2 (100 questions): 91 reclassified, 9 left as genuine clinical
-- vignettes.
-- Batch 3 (100 questions): 89 reclassified, 11 left as genuine clinical
-- vignettes.
-- Running total after this file: 300 of 1705 processed, 1431 remain tagged
-- 'Medicine' (includes both not-yet-processed questions and the ~9-11%
-- genuinely clinical ones from processed batches).
-- ═══════════════════════════════════════════════════════════════════════════

-- Batch 2
update public.questions set subject = 'Clinical Anatomy' where id in (
'0d95619d-034b-45f5-966b-d5326ca967cd','0df111b1-c790-4367-8b83-1faa152e6aea','0e3a6926-3b99-46f8-8504-559c1f3cabfb','0fd2c7e4-00f4-4dd4-86ce-0fe466fe35e8','1036252d-1451-4f22-81df-428ecd446961','10e9e81b-0271-4f5c-b100-c6349bd2652c','12ab87d5-71cb-48d1-b814-d83b12da3891','12b3be26-5282-437b-928b-add0cd1d4fa8','13db414b-ee31-47b2-876c-c9bd02edf1bd','142dbbc9-751a-4ea8-b84c-96a8481b9d76','14390a6a-0a8a-4b25-a017-43b40e9effdc','151c79ce-a269-457a-9d6f-e573524dc5c8','15935567-7a7e-489f-8ac3-0589d81e5502','17167466-1428-41d4-b6a7-ee804ef56319','17b13b0f-1a3d-4d5a-b217-3ccb3896cb24','17b60bb1-d06a-4fab-a317-84268527933c','18347bd7-baaf-49e7-882d-b12473a964dd','19121dde-b44e-41cf-a951-d2bd2e95ee56','1968bc4a-b555-411a-aa85-08cd23af43f6','1a2f8c6b-b288-41e6-bf4e-b2b25a915b6e','1ada1a64-dfdc-4926-81c6-395c2baae64a','1c1b2b28-1c88-4d75-840e-51e4a63ec542'
);
update public.questions set subject = 'Applied Physiology' where id in (
'0dd836a1-db81-4b14-adb8-3495641a9a0c','0e3e4309-0268-44eb-86e6-146fa68c47e5','0eec17f6-49f0-4331-8667-b2500f0516bd','0f36a6b3-b320-4d65-ad55-ed785fe34e9a','0fe91eaf-ff88-4007-a736-9a0071a31318','149c79f5-7136-4af9-b0e1-3e488e20ca24','15028d67-bd49-431c-aa43-a1cdab0e196a','1656758b-56b1-4b62-92ef-7fe8c4b6c2ca','16acb2a6-5747-4547-a7b2-53c5844942c1','17b4ade4-7574-4aad-9868-72d83840959c','17d099e3-1fec-4d77-a9c2-e0ae5ee0e9ff','17d6a0b8-e48b-4563-9cdc-e93a003a1c39','1800fbdc-3f61-4227-b906-d4a460a6bdf3','180b9e0b-bcd2-4077-9a96-96c2d1092bb0','1949a394-e2cc-478c-98ae-26a147957492','19939fa1-cae6-4285-ac7c-627472502d58','19e77cd2-ab6e-4ef7-8b7e-401cf686bef0','1a69dfa8-f89a-4be2-b690-19f63058ecee','1b697af7-68e6-4046-aea4-ac79473d1f95'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'0dda0f78-349b-4322-ba1d-d3efdb2fa97a','0de1a566-be5c-4aaa-9740-4e5569ca101a','0f28b70a-d753-46a9-a4d4-f8f8e6d0cf01','0fdfe717-6704-46ca-85fb-2e6eb47347ff','124a5f52-e699-4c05-8a81-816f3dc3db76','13f9a0a7-a662-471f-a8bb-c8cbd7d7ceb4','14afb085-e3c1-4081-9e4d-dfa902ecf104','15bae16a-a30f-4d02-adfe-4c9b55df3935','1a5a446a-03a8-4e8d-b767-cbc08053734e'
);
update public.questions set subject = 'Applied Pathology' where id in (
'0e243d8d-4b0d-4c53-a9ea-5df556e85b84','0e2ee18b-d422-4f28-8682-000e28e64be0','0eed288c-621f-438c-9fda-4d8c609637b7','0ef78bf9-53f4-449a-aa75-d45b90914c52','0f49bec0-8308-4996-8d8d-2781c3ac5e50','101b3efc-3244-4a1b-a6ae-ef8f027bc858','10b55a6d-cfb9-44a2-ad0c-6d083a72787f','125e6810-1e11-473a-af00-9107e94a2b6c','1292310a-c5bc-49d1-a376-269caba0eef2','15765227-5aba-4a99-bfe6-6c6f6f7a1220','17000b68-b0ac-4263-8a21-027050a88503','17d2b898-4b14-4857-9508-b11bc3679cc2','18f8323a-f07e-4676-a214-818ec9d59b72','192be94e-32ec-49d1-8480-36c0bd040244','19aaefad-4f7e-42c4-a808-ee1a10049c43','1a1e71e0-2459-476d-904c-442f6640d079','1bad43f5-55be-463b-9e4c-0d64927753b0','1bc992d8-88a1-484e-a053-7f2bd5f5dad0','1bcf1b52-0ccd-40b3-8d4b-3d73f21d8277','1c580e83-594a-4f1a-978e-ef9ea7d8f143'
);
update public.questions set subject = 'Immunology' where id in (
'0e41272b-8536-49a6-af7b-25514a2cc559','0f361363-c0ef-4959-85be-5f0d4841b5f7','0f80718a-16b8-44e8-8a4d-af894c3b58de','0fa04dbb-012e-4359-a03f-8d70281bad41','102d75c3-c985-446c-aa83-415b7e90f179','11cdc95a-801c-42b7-b4b2-203930ce5b7b','1323b0e5-4d7f-4125-a818-5b2b9f3cbbf5','145e6f23-ae11-48bb-b17c-d59c04f99076','194b8e17-19c9-4b90-b35d-7902d1be7a48','1aa9df9c-292a-46dc-90e5-234436f87c87'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'0e637652-130a-4770-9664-efe7c948087b','1012985f-c53a-4d9e-b067-1b6e74292a6a','104a72f8-69ea-4741-9592-53d080a7b64c','183ff9a2-6a3a-44f2-9226-69f2f157b2a5'
);
update public.questions set subject = 'Microbiology' where id in (
'102caed7-aef2-4f0e-8f90-8d3f1485c624','146f7e7b-b51a-4ab0-b29f-ca70c2d828d4','152a7c58-a45f-4b0d-a5b8-67edf0ccd052'
);
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('19627e1b-e341-46c0-81d6-ee15d2ed496d');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('19a1f280-71bb-4afe-8be1-884ae63feb63');
update public.questions set subject = 'Community Medicine' where id in ('1bbc1dec-07ce-4210-8d4c-86802ff2fad2');
update public.questions set subject = 'Anesthesia' where id in ('1c74cea6-45d5-4a23-83fb-c91bdab0ef4e');

-- Batch 3
update public.questions set subject = 'Clinical Anatomy' where id in (
'1ca8e1c8-cb7c-44f0-b884-30a7a33e60d7','1d67d770-d319-44e4-b0ae-abbca2abf1ce','1f82ac8e-6a55-4667-a0b9-4db50d551540','20d68f03-52f6-4830-81a6-2d1e31414533','219e6505-f7a5-4e46-bcc5-33def4384941','21b2f1fd-921b-404f-8c54-55909ee7e3b9','2248066d-098a-464a-bf93-e99e18ca6816','258cb38e-87de-47f1-a2cd-9008d0f295bf','26b0c5ab-de27-4967-a4dd-9662a1838253','28f5a39f-282d-4434-965e-5056f9c76948','296b81ae-cfa9-480d-9c51-8d2a0a1088d0','2a862ef6-b5ce-4801-8531-cf0d34ec3c83','2aa95fc2-94bc-402b-a715-dc2b805d19c5','2b578dde-755b-478f-9185-54198cb6fa2b','2ba22402-8b72-4070-ad6b-fb00fbcacc5c'
);
update public.questions set subject = 'Applied Physiology' where id in (
'1d168267-dd02-437b-b6c2-0aa6f78262e0','1e916731-8cfa-48f3-af00-1ebf9c9dbf66','1ff23b1f-24fc-4efb-aadf-8633ea47c4f8','22a1e528-cb10-400c-8f84-be6a52267ed2','2267b190-4cdd-423d-a4fd-c79ca6f0064d','243f5ad1-1869-40b8-8abe-096cbee16e33','24f041fe-4832-4df2-8009-406eaddb5cc1','258031ca-b012-48e6-aabd-ec30f432d0eb','26c15e52-ae53-4d38-ba31-95c79b7566ad','27b58287-ed3b-42fd-8958-bb3e8d01f26a','27ce430a-ed3f-4914-944f-0b6d05699e12','28c5b5c5-a900-4f72-9fcd-61a7b6edb0bb','28d09e47-df6c-484b-80fc-81e37b8f2763','2926348b-e04f-494b-ad33-3f0620787ac4','2b65b90c-114f-4a91-a7c8-719019007fde'
);
update public.questions set subject = 'Applied Pathology' where id in (
'1d1ba287-6f4d-4ec5-a1d0-fb7f39cec209','1de56db9-2ce8-4c17-b891-954e90fd0c3f','1f1fa927-6f24-4572-9482-0f6caa64bac8','1ff6b7d7-0f25-4a61-a540-1fb74bd00c7d','2106b1b2-34de-4575-8383-5fb2b9fa0383','2132a305-fecb-4c20-b050-f4f9188b3beb','21674c5e-2bf4-4f06-a025-3ac43c706959','23548bc7-f900-41bf-9846-c774b4842255','23937ac4-9502-4d36-aa73-1b1b55f83b77','2414fa7f-5f8b-417a-bda4-bd01bd0d5835','2459bed5-9026-45dd-9902-7843d24f071d','24c070ab-21c8-46d0-bd00-ae9753fe6f17','254863a6-cbba-4980-807e-649afef7319a','2580e391-54ac-4add-adf1-2a83b45c627d','25d52773-e237-4581-90cd-afa5dcb81817','271f2c7b-d21e-443f-b9dd-627d1760d950','272ed89f-e830-48ca-b9cb-111287fbf754','284431d4-972e-4536-81f7-f5de78ba64b7','28946aeb-cf3c-4af0-befd-d23cbb2ad90c','28d9b9e1-de6c-4cbe-b350-64ff1fc27295','2994b028-8f4b-42b7-ae35-dc72aaabaf52','29b26c03-b499-42ce-89e7-99fe5cc22abf','29b797de-f2da-498c-b974-6a179970cf60','29ca090a-39b1-42bb-8be4-233a4b49d55b','2a12ea33-ab48-4d89-927c-22fa2e807dd6','2a2f13fb-fddb-48a0-93ea-ed22bbc9530b','2a63d1ab-6592-4562-8fbb-6698976cdeb5','2ad06be7-90da-4009-a6d9-33b6256188e7','2c36cb6a-a646-4a6f-8735-293422de5c76'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'1d53daf9-dc15-4f24-bb8e-2e3df8a1d499','22680eb1-d4ff-4e1d-a601-9b88cb68d91b','26f40704-556f-4704-8fcf-2975587c9396','2714f532-d258-46b3-b6ea-11c474ef9345','298f321c-d91f-4ec4-9866-72f02427fa09','29c43fc9-e013-427f-b7fe-c23620cf803d','2a9d9ca3-81ec-4f7f-944d-47ad7046dff8','2ab52364-dce6-405f-8d6e-ae7d9732fbf7','2ac022c8-848f-4481-b94c-8246d85a9c8f','2c0bb06a-588f-47a6-b291-974d3cdcc9ee'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'1e555685-dcd8-4ce7-8994-ad86d5f9a5b7','1fb96961-6e6d-4932-908f-e28d813cf33a','2033f1ce-bc5c-4ac3-9a80-dd67b3aed8a1','23073afa-0584-4e86-94b0-5584f561b707','299baa35-ec74-491a-9a36-7415c09ae234','2beecef5-0e55-46d4-a546-0b54f28bcc61','2c456c47-f9ba-4043-bd68-7ada0e0ecc71'
);
update public.questions set subject = 'Immunology' where id in (
'1caf2524-c6b7-434c-8b79-43483942015e','1e9b9e26-2d86-4764-9803-4d67d4cdca83','2020ea9f-1274-41b1-ad7c-a71f53d2c27b','25598b78-88ce-4565-ae03-67f0b9c15b43','283bf8d7-5fa0-4bb1-962d-fa4945ca9d36','292e487c-84a7-400b-8728-5269d97707d6','2ac83694-2923-4bc2-ba54-ac7c9bf82ce3','2b89a301-42e0-4b2a-b52f-3f0673c21866','2c0660b2-1668-4ebc-a663-523b8f777f78'
);
update public.questions set subject = 'Microbiology' where id in (
'1d2d61da-a5bb-4996-8e62-683f933b8c70','1daf7773-789c-400f-9c4c-7cbe34d3e61e','219c8e54-9ec8-4c70-b2b9-2a6429355163','2bb48641-825f-480f-89af-653f32882b3d'
);
