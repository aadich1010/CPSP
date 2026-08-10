-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 8: fetched the 100 lowest-id 'Medicine' rows; 37 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- Of the 63 genuinely new rows, 52 reclassified, 11 left as genuine
-- clinical case-vignettes.
-- Running total: 671 of 1705 processed (by DB count), 1034 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Microbiology' where id in (
'6852b309-7304-4fcd-8907-12f5c0d73cdc','6a01e8ec-58a4-4e02-b5f2-3c0309c25fa2','6bef58b0-017a-4ff4-b427-8732fdddbed9','6bfebf5e-00f2-4928-898a-d8ac99c6ebb3'
);
update public.questions set subject = 'Applied Physiology' where id in (
'68700c5b-33e9-4cc3-b01d-4a97b0fda4a9','68c17a42-1ace-4467-b812-e3a16144413c','68deb892-284d-41c7-9fa0-77d4c7e3a2da','6ad67956-e525-431b-8088-77fb2bbd8e18','6b242f14-c167-4ec1-a742-7a6473690f2d','6b991e43-69d4-47b2-8fe1-1110048fcd1a','6bf74367-cc08-4457-a80b-d604ce56b574','6d0b97e5-d148-442b-a726-29f249eb1577','6de511d8-43ba-4cd0-9218-b94ddbc1b0e3','6e5681fb-49ff-45a3-86f2-453eb606979d','6e5c393f-ff65-4db3-8f78-f4b2b508465d','6f33d635-5dd5-415f-8226-14d1909d77c1','6f5c79d2-4837-4b82-8a8d-db9b82772699','6fcbb7e8-4c12-40b5-bc0d-34066e9b34ed','70bd7d15-c281-4bc7-b4fd-095d30b8d266','71298bdf-9165-4151-a0dd-df379489d2e0','714e221c-b9c2-43fb-ba36-a5f583c928c0'
);
update public.questions set subject = 'Applied Pathology' where id in (
'69270c37-82f7-4919-899f-8d87dc2bf1c9','6acc8137-0eae-4352-b34b-7d7f3bc111e5','6e0f70c3-14f4-47ce-a935-0a65608734b3','70f8bf58-4fae-4d5b-99d9-a5774f0eba9d'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'69daf474-e2a0-43fb-9ca3-68d3d7a7751b','6b116707-0e51-4335-b3b8-ede593a21fea','7014e36a-abde-4ae8-a93b-1aeb561f94b1'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'6a796491-90d1-47b6-8161-0c2a8c715105','6c30da35-dd6b-4e39-a51d-23eddbb47188','6ca90bf3-d638-42c2-b149-6f7ab99a85bb','6d25894e-2137-49ad-b222-a8eba795e8bc','6deb2472-1586-48ac-bfb1-a95796066437','6ea83c1c-7997-4673-9251-49847e514c07','706835df-4146-40b6-87d7-64931c1c7d02'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'6b3794b9-f55f-4b1c-b3f8-107a016fa651','6d816c06-9a93-4564-9482-8057bbeed762','6ee4b428-4c4a-4572-808a-d2c1f860959e','705da06f-7e62-468e-b623-c02707168a94'
);
update public.questions set subject = 'Immunology' where id in (
'6c2cd839-ff80-4ace-a9c3-f114909fb36f','6d0ff754-17ed-48eb-9c51-b6bf86237b45','6e1318b6-969e-41bf-9fa2-beb3c71367b3'
);
update public.questions set subject = 'Obstetrics & Gynecology' where id in (
'6d3224fa-7a7f-423d-b597-5c1dea368df3','6ef37545-3651-4271-8a21-1a123ad3fd3f','709cfb20-de63-4c47-92ee-e6522140f061'
);
update public.questions set subject = 'Pediatrics' where id in ('6d627af2-943f-43ad-bfba-74cabec3c415','715082e5-97c1-4124-8b01-00e0a65403eb');
update public.questions set subject = 'Ophthalmology' where id in ('6f251e5d-a7af-4c4e-afc6-37576aecb1b8','7044e41f-f563-450d-8641-4505ee80f11e');
update public.questions set subject = 'Community Medicine' where id in ('6ff4cb38-57d9-48a6-aa7d-8afe2570e0e4');
update public.questions set subject = 'Anesthesia' where id in ('70a2ec75-76e4-4193-aefb-9b21d4562227','70dd3a42-e6d2-44c6-a58f-9540b5631574');
