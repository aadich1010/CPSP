export interface FeatureDetail {
  id: string;
  icon: string;
  title: string;
  shortDesc: string;
  color: string;
  bg: string;
  border: string;
  fullDesc: string;
  benefits: string[];
}

export const FEATURES: FeatureDetail[] = [
  {
    id: 'smart-analytics',
    icon: '📊',
    title: 'Smart Analytics',
    shortDesc: 'Deep-dive into your performance with subject-wise heatmaps and global peer ranking.',
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#ccfbf1',
    fullDesc: 'Our Smart Analytics engine is the core of the FCPS Simulator experience. It doesn\'t just tell you if you passed or failed; it breaks down your performance across every individual subject and system. By analyzing your answer patterns, time spent per question, and historical progression, our AI generates dynamic heatmaps highlighting your precise weak spots, enabling laser-focused study sessions.',
    benefits: [
      'Subject-Wise Heatmaps for targeted revision',
      'Global Peer Ranking to benchmark your standing',
      'Time-management analysis per question category',
      'Historical progression tracking'
    ]
  },
  {
    id: 'forensic-security',
    icon: '🔒',
    title: 'Forensic Security',
    shortDesc: 'Dynamic digital watermarking and session monitoring ensure absolute question bank integrity.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ede9fe',
    fullDesc: 'We take the integrity of our high-yield question bank seriously. Our platform utilizes advanced forensic security measures including dynamic, user-specific digital watermarking that is virtually invisible but completely traceable. Combined with strict session monitoring and anti-copy mechanisms, we ensure that the elite study material remains exclusive to our premium subscribers.',
    benefits: [
      'Military-grade digital watermarking',
      'Advanced session and concurrent login monitoring',
      'Screenshot and text-selection prevention',
      'Secure, encrypted data transmission'
    ]
  },
  {
    id: 'hospital-grade-ui',
    icon: '🏥',
    title: 'Hospital-Grade UI',
    shortDesc: 'Experience the exact CBT environment used in actual examinations for zero-anxiety on exam day.',
    color: '#ec4899',
    bg: '#fdf2f8',
    border: '#fce7f3',
    fullDesc: 'The biggest hurdle for many candidates is exam-day anxiety caused by an unfamiliar interface. We have meticulously reverse-engineered the exact Computer Based Test (CBT) environment used in the actual FCPS examinations. From the layout of the navigation buttons to the exact color hex codes and timer behaviors, practicing on our platform ensures you walk into the exam hall feeling completely at home.',
    benefits: [
      '1-to-1 exact replica of the official CBT interface',
      'Familiarization with flagging and review mechanics',
      'Realistic timer and warning notifications',
      'Complete elimination of interface-related anxiety'
    ]
  },
  {
    id: 'ai-powered-organization',
    icon: '⚡',
    title: 'AI-Powered Organization',
    shortDesc: 'Smart subject-detection and high-yield question categorization for targeted study.',
    color: '#eab308',
    bg: '#fefce8',
    border: '#fef08a',
    fullDesc: 'Our backend utilizes an advanced Artificial Intelligence model trained specifically on medical literature to automatically categorize questions. When new mock exams are imported, the AI intelligently detects the subject, sub-specialty, and difficulty level. This allows you to filter and generate custom mock exams targeting highly specific areas like "Cardiology Anatomy" or "Neuro-Pharmacology".',
    benefits: [
      'Automated, highly accurate subject tagging',
      'Custom exam generation based on specific weak points',
      'Difficulty-level sorting and progression',
      'Continuous refinement of question categorization'
    ]
  },
  {
    id: 'real-time-synchronization',
    icon: '🔄',
    title: 'Real-Time Synchronization',
    shortDesc: 'Zero-lag optimization for a seamless, high-speed testing experience.',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#dbeafe',
    fullDesc: 'Every second counts during your exam. Our platform is built on edge-computing infrastructure ensuring zero-lag optimization. Every answer choice, every flag, and every navigation click is synchronized in real-time with our secure servers. Even on slower internet connections, the test-taking experience remains completely fluid and uninterrupted.',
    benefits: [
      'Instantaneous answer recording and navigation',
      'Edge-network delivery for rapid asset loading',
      'Offline-tolerance for minor connection drops',
      'Cloud-backed progress saving every millisecond'
    ]
  },
  {
    id: 'vvip-support',
    icon: '👑',
    title: 'VVIP Support',
    shortDesc: 'Dedicated activation assistance and 24/7 technical monitoring for premium users.',
    color: '#f97316',
    bg: '#fff7ed',
    border: '#ffedd5',
    fullDesc: 'As a premium medical professional preparing for a high-stakes exam, your time is your most valuable asset. Our VVIP Support guarantees that you never lose a minute to technical difficulties. Enjoy immediate, manual account activation via WhatsApp, priority routing for any queries, and proactive 24/7 technical monitoring of your exam sessions.',
    benefits: [
      'Direct WhatsApp line for instant query resolution',
      'Priority routing bypassing standard support queues',
      'Dedicated activation assistance and onboarding',
      'Proactive monitoring to prevent disruptions before they happen'
    ]
  }
];
