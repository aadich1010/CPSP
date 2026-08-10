-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 9: fetched the 100 lowest-id 'Medicine' rows; 48 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- Of the 52 genuinely new rows, 47 reclassified, 5 left as genuine
-- clinical case-vignettes with no better-fitting specialty subject.
-- Running total: 718 of 1705 processed (by DB count), 987 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Physiology' where id in (
'7155f998-10b5-4d5c-9b0e-96f481d056b5','71673681-df04-4a3c-a0eb-22577401b418','719875cb-b4bd-470f-a951-b9f06f95465d','71c0ede9-b045-4fa8-ac6b-bb0ebb058bab','72598dcd-6e9e-4ba9-b8b3-454521574e21','73e1638d-7f4d-47ba-80e9-d4f5f6ab1a6e','73f42e80-34a5-4543-8b0b-399f3cb78313','74c8828a-ebdd-47d9-b33c-f201413fa40f','758ba6fe-18b9-49d5-8f9a-76162ae886a7','75de5012-5959-45a3-8dac-e656ecfe6f44','7731abc7-fbec-4535-859f-d1e20e2d02e8','7815b8b1-30ef-48a9-89bd-b4cfee19b1c2'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'716330e3-9d9d-4857-8a1b-88b47d3927e8','71fd79d9-205d-44ba-9748-e461dd3ea9b8','72513d05-2505-41d1-b569-4bcf34f99c7e','73336f82-cee9-458c-8d6e-041e14416362','734afc02-e0ce-4ada-91ca-d6ee96ce9e17','73c30262-859a-4bbe-b5cd-8cb09430cc16','7433c4db-f452-49b0-a68f-d2827a93b287','7469f4e1-830f-41ed-aef1-f994143da366','747b09f5-ed9c-4a4d-bf98-ad5123211319','759cc980-19c7-4247-bd72-f273697665f2','772a665f-ad7e-450d-8629-982b1a4a4d45','791456e4-340e-46c0-b535-4ad955e2c53a'
);
update public.questions set subject = 'Microbiology' where id in (
'720054ab-527d-4c4c-9488-d4be0abfd76f','724c43fe-68fa-481f-8671-a236242f2ec9','72866229-2a84-4a63-894b-17e50bb9b794','77e4cc45-4f24-40d0-b207-2eebf936bf46'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'728472c9-7076-4a4c-a5a1-3f70a6553eb6','74bde5f1-3607-46fa-9af5-3860a44f40ef','751c2088-d50d-45f3-b167-270746565923','787ec6f5-45ba-49ef-83fc-812b53e4e68a'
);
update public.questions set subject = 'Applied Pathology' where id in (
'729a7a78-763e-4a25-9d92-3b01758517ce','7341ea0b-91df-4347-b251-061c0cf00668','73a2c239-1d1e-4bf0-a550-21928a8252ef','74ae690f-d70e-44f8-8829-aaa15d041d67','756c7d24-d85d-4377-874c-e0039592f327','763bf129-52c3-45ab-93aa-1e7ced040e61','77b4df79-560e-4f15-9a43-49954f178c93'
);
update public.questions set subject = 'Immunology' where id in ('72a32601-7f53-415c-9c63-5065eb558baf','73bfc62d-f38a-4eb0-8b62-3dc0d5dc5f59');
update public.questions set subject = 'Applied Biochemistry' where id in ('75282290-5582-4caa-9ad8-288cf7e1bac0','77688a5f-e6e5-4107-b3e3-5399feebe5c7');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('75c3843b-7e93-46c2-b41f-ae52e6609648','784660f2-c03d-4e57-bcbb-02db6752de56');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('76468380-d6bc-4acc-a83e-576a1373ec58');
update public.questions set subject = 'Anesthesia' where id in ('76918c23-53f0-4852-867b-7bb96a163f8a');
