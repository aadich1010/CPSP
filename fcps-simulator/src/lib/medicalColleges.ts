/**
 * medicalColleges.ts
 * -----------------------------------------------------------------------------
 * Canonical list of PMDC-recognized medical colleges in Pakistan (public +
 * private, MBBS-granting), for the registration form's searchable "Medical
 * College" dropdown. Grouped by province/territory the same way
 * src/lib/subjects.ts groups subjects, so the <select> can render optgroups.
 *
 * This is a curated reference list, not a live PMDC feed -- colleges open,
 * close, get renamed, or gain/lose recognition over time, and PMDC doesn't
 * expose a public API to sync against. `medical_college` on profiles is
 * stored as free text (not a foreign key), specifically so a student whose
 * college isn't in this list yet can still type it into the "Other" entry
 * without needing a code change. If PMDC recognizes new colleges, add them
 * here in the matching province group.
 */

export interface CollegeGroup {
  province: string
  colleges: string[]
}

export const MEDICAL_COLLEGE_GROUPS: CollegeGroup[] = [
  {
    province: 'Punjab',
    colleges: [
      'King Edward Medical University, Lahore',
      'Allama Iqbal Medical College, Lahore',
      'Services Institute of Medical Sciences, Lahore',
      'Fatima Jinnah Medical University, Lahore',
      'Sheikh Khalifa Bin Zayed Al Nahyan Medical College, Lahore',
      'Ameer-ud-Din Medical College, Lahore',
      'Nishtar Medical University, Multan',
      'Punjab Medical College, Faisalabad',
      'Rawalpindi Medical University, Rawalpindi',
      'Army Medical College, Rawalpindi',
      'Federal Medical & Dental College, Islamabad',
      "Quaid-e-Azam Medical College, Bahawalpur",
      'Sheikh Zayed Medical College, Rahim Yar Khan',
      'Sargodha Medical College, Sargodha',
      'Nawaz Sharif Medical College, Gujrat',
      'Khawaja Muhammad Safdar Medical College, Sialkot',
      'Gujranwala Medical College, Gujranwala',
      'Sahiwal Medical College, Sahiwal',
      'DG Khan Medical College, Dera Ghazi Khan',
      'FMH College of Medicine & Dentistry, Lahore',
      'Shalamar Medical & Dental College, Lahore',
      'Lahore Medical & Dental College, Lahore',
      'CMH Lahore Medical College, Lahore',
      'Rahbar Medical & Dental College, Lahore',
      'Al-Aleem Medical College, Lahore',
      'Akhtar Saeed Medical & Dental College, Lahore',
      'Avicenna Medical College, Lahore',
      'Azra Naheed Medical College, Lahore',
      'Amna Inayat Medical College, Sheikhupura',
      'University College of Medicine & Dentistry, Lahore',
      'Gulab Devi Medical College, Lahore',
      'Central Park Medical College, Lahore',
      'Continental Medical College, Lahore',
      'Pak Red Crescent Medical & Dental College, Lahore',
      'Sharif Medical & Dental College, Lahore',
      'Rashid Latif Medical College, Lahore',
      'Multan Medical & Dental College, Multan',
      'Bakhtawar Amin Medical & Dental College, Multan',
      'CMH Multan Institute of Medical Sciences, Multan',
      'Independent Medical College, Faisalabad',
      'CMH Bahawalpur Medical College, Bahawalpur',
      'Shahida Islam Medical College, Lodhran',
      'Islam Medical College, Sialkot',
      'Sialkot Medical College, Sialkot',
      'Wah Medical College, Wah Cantt',
      'Shifa College of Medicine, Islamabad',
      'Yusra Medical & Dental College, Islamabad',
      'University Medical & Dental College, Faisalabad',
      'Islamic International Medical College, Rawalpindi',
      'Al-Nafees Medical College, Islamabad',
      'Foundation University Medical College, Islamabad',
      'Rawal Institute of Health Sciences, Islamabad',
      'Rai Medical College, Sargodha',
      'Niazi Medical & Dental College, Sargodha',
      'HBS Medical & Dental College, Islamabad',
      'Islamabad Medical & Dental College, Islamabad',
      'CMH Kharian Medical College, Kharian',
      'Abwa Medical College, Faisalabad',
      'Aziz Fatimah Medical & Dental College, Faisalabad',
      'Sahara Medical College, Narowal',
      'HITEC Institute of Medical Sciences, Taxila',
      'M. Islam Medical & Dental College, Gujranwala',
      'Watim Medical College, Rawalpindi',
      'Margalla Institute of Health Sciences, Rawalpindi',
    ],
  },
  {
    province: 'Sindh',
    colleges: [
      'Dow Medical College (DUHS), Karachi',
      'Jinnah Sindh Medical University, Karachi',
      'Karachi Medical & Dental College, Karachi',
      'Chandka Medical College, Larkana',
      'Liaquat University of Medical & Health Sciences, Jamshoro',
      'Peoples University of Medical & Health Sciences for Women, Nawabshah',
      'Dow International Medical College, Karachi',
      'Shaheed Benazir Bhutto Medical College, Karachi',
      'Ghulam Muhammad Mahar Medical College, Sukkur',
      'Bilawal Medical College, Jamshoro',
      'Gambat Medical College, Gambat',
      'Aga Khan University Medical College, Karachi',
      'Baqai Medical College, Karachi',
      'Isra University Medical College, Hyderabad',
      'Hamdard College of Medicine & Dentistry, Karachi',
      'Jinnah Medical & Dental College, Karachi',
      'United Medical & Dental College, Karachi',
      'Sir Syed College of Medical Sciences for Girls, Karachi',
      'Ziauddin Medical College, Karachi',
      'Liaquat National Medical College, Karachi',
      'Liaquat College of Medicine & Dentistry, Karachi',
      'Al-Tibri Medical College, Karachi',
      'Muhammad Medical College, Mirpurkhas',
      'Bahria University Medical & Dental College, Karachi',
      'Indus Medical College, Tando Muhammad Khan',
      'Karachi Institute of Medical Sciences, Karachi',
    ],
  },
  {
    province: 'Khyber Pakhtunkhwa',
    colleges: [
      'Khyber Medical College, Peshawar',
      'Khyber Girls Medical College, Peshawar',
      'Ayub Medical College, Abbottabad',
      'Saidu Medical College, Swat',
      'Gomal Medical College, Dera Ismail Khan',
      'KUST Institute of Medical Sciences, Kohat',
      'Bacha Khan Medical College, Mardan',
      'Bannu Medical College, Bannu',
      'Nowshera Medical College, Nowshera',
      'Gajju Khan Medical College, Swabi',
      'Peshawar Medical College, Peshawar',
      'Pak International Medical College, Peshawar',
      'Kabir Medical College, Peshawar',
      'Jinnah Medical College, Peshawar',
      'Rehman Medical College, Peshawar',
      'Al-Razi Medical College, Peshawar',
      'Northwest School of Medicine, Peshawar',
      'Frontier Medical College, Abbottabad',
      'Abbottabad International Medical College, Abbottabad',
      'Women Medical College, Abbottabad',
    ],
  },
  {
    province: 'Balochistan',
    colleges: [
      'Bolan University of Medical & Health Sciences, Quetta',
      'Quetta Institute of Medical Sciences, Quetta',
      'Loralai Medical College, Loralai',
    ],
  },
  {
    province: 'Azad Kashmir & Gilgit-Baltistan',
    colleges: [
      'Mohtarma Benazir Bhutto Shaheed Medical College, Mirpur',
      'Poonch Medical College, Rawalakot',
      'Gilgit Medical College, Gilgit',
    ],
  },
  {
    province: 'Other',
    colleges: ['Foreign / International Medical College', 'Other (not listed)'],
  },
]

/** Flat list, for search/autocomplete and for validating a submitted value. */
export const MEDICAL_COLLEGES: string[] = MEDICAL_COLLEGE_GROUPS.flatMap((g) => g.colleges)
