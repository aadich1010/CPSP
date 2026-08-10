-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 21: fetched with an id-offset (90) to skip repeats directly.
-- All 100 rows were genuinely new; 98 reclassified, 2 left as 'Medicine'
-- due to corrupted/mismatched source data (flagged for admin review):
--   e6f281db-fc3c-4f2f-b5d4-aa003cee71f6 (question describes classic
--     hypersensitivity pneumonitis -- respiratory symptoms improving on
--     vacation, biopsy with lymphocytes/eosinophils, hilar nodes -- but
--     the explanation is about viral-infection CBC findings, unrelated)
--   f3f78199-ce7d-4ed7-8ba0-cf519f595e5c (question asks about tremor at
--     end of movement -- an intention/cerebellar tremor -- but the
--     explanation describes Parkinson's resting tremor (TRAPS), which
--     contradicts the question stem)
-- Running total: 1540 of 1705 processed (by DB count), 165 remain
-- tagged 'Medicine'. Verified via count(*) = 165 (delta of 98 from the
-- prior 263, matching expectations exactly).

update public.questions set subject = 'Applied Physiology' where id in (
'e59cc8df-b11b-41fc-b272-4a9a092684a3','e7086386-3958-4347-8b05-405fd848240d','e7bb11cd-0213-4366-be3d-e2c19b3b49ef','e82da97d-f7c1-48ba-8c56-b8caa2cb0bd8','e8683bf3-7a79-49a3-80a2-dcf47fb0b0ab','ea044676-62a0-41d9-90b1-73a735437616','ea2f0d35-1920-46b4-a4b5-a1ac7503c677','eac81ec5-6af3-43d5-9d02-3b1ba28fde43','ebe4033e-a9b4-4bb5-a2a1-d3a7728bbd2e','ebf75aff-1200-4a65-8229-6fe7e1405492','ec254019-0b3c-4794-9b08-e407a7344c54','ec58a445-d65f-4643-a7e3-960b621ad3df','ec98869c-7eed-40a8-aa4b-53410651be4d','eef9b040-e5c2-436d-89ad-25e6a7f54571','ef2edd92-d74d-4ce4-9ee5-b6520df54572','f0eb86a3-b6ed-46d7-a846-8e6bd8e17559','f172a61a-805f-4bc1-8234-067f9c56253b','f2bb171e-2022-41ba-a6e6-a72adc19dd49','f2dac441-2ef9-4489-9740-766112ad1c49','f4c5f54d-39ba-4fd6-8da6-419f93f80046','f52542ef-9e05-4b08-8c89-8396693065e4','f5fb99d1-ba38-4a56-9197-6092a3d4308f','f645ae3e-298b-4534-9889-0da48e85d5f9'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'e5df7057-7d67-44e1-8421-145dc4b882b3','e68fa4fb-9def-4536-9564-d6e11b284241','e6ef334f-60d4-4481-b9b6-476cddff5de2','e6f514c8-3c26-4906-b78a-89cc2bc6c11b','e8b6437e-7adf-4be0-8a00-3a8946e69298','eca2f5c9-1115-4fc8-b193-47e9bf8f68d7','ed1df97a-cc65-4a08-a6d6-734f4ceed685','ed5da463-6836-4d14-b846-8d7ad1f697a1','ed9c79ba-ff71-4577-8ce5-81dae84820ca','edf60b87-88de-4efa-9735-867653aff1c3','ee7a12fa-5a16-4bb8-92eb-829e2d3363e8','eecfadbf-1958-4be3-9e5c-c9a6f0203840','ef26b114-2e05-410e-80ae-90c1aa324ed8','ef3550d2-88ea-4e43-955b-f31bf528e27b','ef6e5b14-bc13-4d34-8cdc-15815f878a74','efb88899-6bac-486a-91f0-7b0ebba89e28','f17ddaf5-905b-422c-8da1-8902a15f8d82','f1b39d0b-ede5-45e8-84ef-7bbcc57dd891','f5ca4b5a-9597-4950-8f6e-7b785079172a','f5e747e9-e799-45c8-a34b-33209a66754c'
);
update public.questions set subject = 'Applied Pathology' where id in (
'e5ffc5e1-ae65-4973-8c48-b4aad81a6a03','e6b0b439-02eb-40f2-9aac-1f882bf6a5c3','e80f66dd-93d3-4a93-82ee-e1be570612de','e868afe2-cf58-4635-926e-2dd157ac4bd0','eada0444-32d5-4742-9ce0-05564c1fafe2','eb4c6abf-42f5-4ac7-b045-6d71725822b4','eb996807-2b5c-4f56-a184-f18ae5aebf2f','ed2e6d71-cab7-4c0d-bcba-5697df448779','ee93ddbe-7567-4f14-ac6a-ffab07317fbb','eef9a8c7-8ab1-4854-a014-daa3d9177432','ef03e467-b919-47ff-bcfa-b7c28fe973a5','ef11e62c-85ad-4c57-a05d-54de9d0fbf72','ef24b4cd-e4ba-459c-aacc-b04618b7e508','ef5e09c8-f5e5-4142-9e16-162d26aab7e9','efc9c9a9-6f95-467b-be24-a0b54f0f1cbc','f031df9b-ef47-4ee5-a969-851ceff46f15','f08ba4d1-759f-424d-b6e3-f3b82cf9105a','f383de0f-b561-48a0-a0c7-fae26c5eb6be','f39781f4-ea31-4f76-a3b0-7495c1ab8cb1','f3efd8fe-fa3d-4a8c-85b6-02db4468f5b6','f4b884b3-5d06-4f64-8941-297fa2f13d9c','f61e2d6d-c1b2-46a0-8f2d-9ac516e2dfe9'
);
update public.questions set subject = 'Applied Biochemistry' where id in ('e9cbbda7-e540-4064-a421-1aef0e3aff3f','eae4913b-61f5-44d8-a829-395cc452b294','edd91f22-bb19-4321-98e6-7c0ecf2e5c72','efa55202-1f66-4df0-8222-3941295ab7d3','f12fea5b-4804-495a-8703-1a03580d0712');
update public.questions set subject = 'Applied Pharmacology' where id in ('e6786bee-d113-4069-9632-424eeaeaf5d4','edf61667-4322-4573-9813-127032e98857','ee2338cd-4377-4ed4-9ff2-7857af8aa373','efa476b9-c0c9-455b-a57c-1a9636f3760f','f2961e11-7f68-47ca-b144-acf43021337a');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('e78cf3b8-6386-42ec-9342-50b8f1859b16','e90ed830-3916-4c95-9431-923a3b1d2684','e98d1b29-37ca-4db4-a3ae-d9caf8011a93','f02b38b6-a2da-41bd-b991-c270297b52e1','f09b8e2a-c978-47f3-8d4a-61b9c2bd6b32');
update public.questions set subject = 'Microbiology' where id in ('e6f24990-bd3d-48ba-aa26-1bf18e34946d','ea5b9722-dc4b-4ddd-bf2f-d88394500685','ec1ec00d-aa9f-4524-9cd8-f9f3caa43974','ecbd301f-2be3-40df-bfa5-e4ea16a27d75');
update public.questions set subject = 'Immunology' where id in ('eadaac93-d381-4425-ad13-358e7743694a','eef5b2c8-33e0-4c94-a8c6-68339dc544be','f3f4c8a8-31d7-4ed6-8530-3dfc6e8bc188','f63a6494-93a7-48e6-8b64-15159a879df0');
update public.questions set subject = 'Emergency Medicine / Critical Care Basics' where id in ('e6093b6e-ba06-403c-aa07-1479cd628742');
update public.questions set subject = 'Ophthalmology' where id in ('ecc1760a-43c9-4c8f-8a0c-aee239d77a10','f076ef41-016a-444c-a853-2d9d37df0c41');
update public.questions set subject = 'ENT' where id in ('ebe90dbf-4c6b-4944-b686-f3c2fca0f8b6');
update public.questions set subject = 'Pediatrics' where id in ('ee307ccd-4d36-4ead-ab63-5d9dab39d43d');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('ef555eb2-9528-48a3-b979-efaab4564788','f4297ac3-4ad5-49bf-af47-ea04663b9f2a');
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('f375805b-feef-426e-b81c-f4e621335a5d','f447fb65-ebc8-4314-ad33-c90e9fd70f38');
update public.questions set subject = 'Anesthesia' where id in ('efbbf81a-6c96-4470-85e4-7d34ea3211b4');
