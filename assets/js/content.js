/* ==========================================================================
   content.js — ALL of your site's content lives here.
   --------------------------------------------------------------------------
   • Edit this file only; the layout/rendering code never needs to change.
   • Strings are rendered as HTML, so you can use <a>, <em>, <b> inline.
   • Any section whose list is empty (or removed) is hidden automatically,
     and the nav / section numbering adjust themselves.
   • Everything below is PLACEHOLDER content for design iteration.
   ========================================================================== */

window.SITE = {
  meta: {
    title: "Ken Zheng",
    description:
      "Researcher in computer vision, robot learning, and embodied intelligence.",
    // Color palette: "cyan" | "arctic" | "mint" | "amber" | "infrared" | "violet" | "lime" | "signal" | "mono"
    accent: "cyan",
    // Shown in the footer + hero strip. Leave "" to use the file's modified date.
    updated: "2026-11-22",
    // Hero background animation: "network" | "none"
    background: "network",
    // Which publication filter is active on load: "all" | "selected" | a tag
    pubDefaultFilter: "all",
    // How many news items to show before the "show all" toggle
    newsLimit: 5,
    // Visit stats (dashboard: https://kenzhengjk.goatcounter.com). Leave "" to turn off.
    analytics: "https://kenzhengjk.goatcounter.com/count",
  },

  profile: {
    name: "Ken Zheng",
    altName: "",
    role: "Undergrad @ UC Berkeley EECS",
    // affiliation: "UC Berkeley",
    status: "",
    photo: "./assets/img/ken.jpg", // e.g. "assets/img/portrait.jpg" (4:5 works best)
    detectionLabel: "carioca",
    email: "kenzhengjk@berkeley.edu",
    location: "Berkeley, CA",
    bio: [
      `I was born in Rio de Janeiro, Brazil, and grew up across Latin America and Asia.  I'm currently an undergraduate at <a href="https://eecs.berkeley.edu">UC Berkeley</a> studying Electrical Engineering & Computer Sciences (EECS). 
       I work at the intersection of <b>computer vision</b> and <b>robot learning</b>, aiming to build
       embodied agents that perceive, reason about, and act in the physical world.`,
      `I'm a researcher at <a href="https://bair.berkeley.edu">Berkeley AI Research (BAIR)</a>, advised by
       <a href="https://people.eecs.berkeley.edu/~trevor/">Trevor Darrell</a>. I also work closely with <a href="https://dchan.cc">David M. Chan</a> and <a href="https://roeiherz.github.io">Roei Herzig</a>.
       Previously, I've collaborated with Profs <a href="https://dawnsong.io">Dawn Song</a> and <a href="https://ssr-group.net">Wenbo Ding</a>.`,

    ],
    links: [
      { label: "Email", url: "mailto:kenzhengjk@berkeley.edu", primary: true },
      // { label: "CV", url: "assets/files/cv.pdf" },
      { label: "Scholar", url: "https://scholar.google.com/citations?user=BllX0_sAAAAJ&hl=en" },
      { label: "GitHub", url: "https://github.com/kenzhengjk" },
      // { label: "X", url: "https://x.com/" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/kenzhengjk" },
    ],
  },

  // Optional: link co-author names anywhere they appear in publications
  people: {
    "Ken Zheng": "https://example.com",
    "Trevor Darrell": "https://people.eecs.berkeley.edu/~trevor/",
    "Roei Herzig": "https://roeiherz.github.io",
    "David M. Chan": "https://dchan.cc",
    "Wen-Han Hsieh": "https://wen-hanhsieh.github.io",
    "Dawn Song": "https://dawnsong.io",
    "Yiyou Sun": "https://sunyiyou.github.io", 
    "Wenbo Ding": "https://ssr-group.net",

  },

  // news: [
  //   { date: "2026-11", text: `Applying to PhD programs for Fall 2027 - happy to chat about research!`, highlight: true },
  //   { date: "2026-05", text: `Three papers accepted to <b>NeurIPS 2026</b> workshops.` },
  //   { date: "2026-05", text: `Started a summer internship at <b>Meta</b>.` },
  //   { date: "2025-09", text: `One paper accepted to <b>NeurIPS 2025</b>.` },
  //   { date: "2025-06", text: `One paper accepted to <b>IROS 2025</b>.` },
  //   { date: "2024-05", text: `Began summer internship at <b>Microsoft (MSR)</b>.` },
  //   { date: "2023-08", text: `Began undergrad at UC Berkeley EECS.` },
  // ],

  // research: {
  //   statement: `How can robots learn to see the world in terms of what they can <em>do</em> in it?
  //     I'm interested in representations that bridge perception and action — learned from
  //     large-scale video and interaction — and in using them to build generalist agents.`,
  //   themes: [
  //     {
  //       icon: "vision",
  //       title: "Perception for action",
  //       text: "3D-aware visual representations grounded in affordances, geometry, and physical interaction.",
  //       tags: ["3D vision", "video", "affordances"],
  //     },
  //     {
  //       icon: "robot",
  //       title: "Scalable robot learning",
  //       text: "Policies that generalize across tasks, embodiments, and environments with minimal supervision.",
  //       tags: ["imitation", "RL", "sim2real"],
  //     },
  //     {
  //       icon: "world",
  //       title: "Embodied world models",
  //       text: "Predictive models of how the world evolves under an agent's actions, used for planning.",
  //       tags: ["world models", "planning"],
  //     },
  //   ],
  // },

  /* Publications
     - authors: use your exact profile.name (or pubName below) to get highlighted;
       append "*" for equal contribution, "†" for equal advising.
     - tags drive the filter chips. selected:true puts it in "Selected".
     - image/video: teaser media (16:10). Leave empty for a placeholder.
       videoLabels: optional [[seconds, "text"], …] corner tag synced to the video. */
  pubName: "Ken J. Zheng",
  publications: [
    {
      id: "hdh",
      title: "Learning Low-Latency Action Verification for Frozen Vision-Language-Action Models",
      authors: ["Wen-Han Hsieh", "Ken J. Zheng", "Chia-Chien Chen", "David M. Chan", "Trevor Darrell"],
      venue: "Preprint",
      venueNote: "",
      year: 2026,
      award: "", 
      selected: false,
      tags: [],
      tldr: "Improves VLA action selection using a lightweight verifier trained on deployment rollouts, boosting manipulation success without expensive verification.",
      image: "assets/teasers/hdh.jpg",
      video: "assets/teasers/hdh.mp4",
      // corner tag per segment — printed by tools/make_teaser.py (speed vs. real time; sources are already 2×)
      videoLabels: [[0, "method"], [2.32, "real robot · 4×"], [5.13, "6×"], [8.34, "7×"]],
      links: { project: "https://wen-hanhsieh.github.io/hdh/", pdf: "https://arxiv.org/pdf/2611.14834", arxiv: "https://arxiv.org/abs/2611.14834", code: "https://github.com/Wen-HanHsieh/hdh_real" },
      bibtex: `@misc{hsieh2026learninglowlatencyactionverification,
      title={Learning Low-Latency Action Verification for Frozen Vision-Language-Action Models}, 
      author={Wen-Han Hsieh and Ken Jiankun Zheng and Chia-Chien Chen and David M. Chan and Trevor Darrell},
      year={2026},
      eprint={2611.14834},
      archivePrefix={arXiv},
      primaryClass={cs.RO},
      url={https://arxiv.org/abs/2611.14834}, 
}`,
    },
    {
      id: "pair",
      title: "PAIR: Distance-Preserving Compression for Fast Inference and Adaptation of Vision-Language-Action Policies",
      authors: ["Kian Hosseinkhani", "Mehran Aghabozorgi", "Ken J. Zheng", "Kaito Suzuki", "Andy Zhang", "Dantong Niu", "Trevor Darrell", "Kry Yik Chau Lui", "Roei Herzig", "Ke Li"],      venue: "Preprint",
      venueNote: "",
      year: 2026,
      award: "", 
      selected: false,
      tags: [],
      tldr: "Compresses VLA visual tokens by preserving pairwise distances, achieving 14x shorter sequences and 2.4-2.8x faster inference preserving task success.",
      image: "assets/teasers/pair.jpg",
      video: "assets/teasers/pair.mp4",
      // corner tag per segment — printed by tools/make_teaser.py
      videoLabels: [[0, "method"], [2.32, "real robot · 4×"], [4.18, "3×"], [6.16, "4×"]],
      links: { project: "https://kianhk6.github.io/PAIR/", pdf: "#", arxiv: "#", code: "#" },
      bibtex: ``,
    },
    {
      id: "attention-icl-robustness",
      title: "Not All Attention Is Created Equal: Robustness of In-Context Learning Across Attention Mechanisms",
      authors: ["Joshua Lu", "Ken Zheng", "Lenci Ni", "Tiger Zhang", "William Li", "Gireeja Ranade", "Anant Sahai"],
      venue: "Preprint",
      venueNote: "",
      year: 2026,
      award: "",
      selected: false,
      tags: [],
      tldr: "Attention mechanism robustness in ICL is shift-dependent, with no single architecture consistently outperforming others across distinct distribution shifts.",
      image: "assets/teasers/attention.jpg", // query MSE under six prompt/query shifts
      links: { pdf: "#", arxiv: "#", code: "#" },
      bibtex: ``,
    },
    {
      id: "rococo",
      title: "ROCOCO: Robust Outline Completion of Occluded Curvilinear Objects",
      authors: ["Ken Zheng", "Jaimyn Drake"],
      venue: "NeurIPS 2026",
      venueNote: "Workshop: New in Machine Learning",
      year: 2026,
      award: "",
      selected: false,
      tags: [],
      tldr: "Enables mask-free inpainting of occluded curvilinear features, outperforming existing methods using a lightweight cascaded U-Net to flow-matching architecture.",
      image: "assets/teasers/rococo.jpg",
      video: "assets/teasers/rococo.mp4",
      // blind completions from the paper's qualitative figure (wires top, cracks bottom)
      videoLabels: [[0, "occluded input"], [1.35, "ROCOCO · blind"], [3.25, "ground truth"]],
      links: { pdf: "https://arxiv.org/pdf/2610.29177", arxiv: "https://arxiv.org/abs/2610.29177", code: "https://github.com/kenzhengjk/ROCOCO" },
      bibtex: `@misc{zheng2026rococorobustoutlinecompletion,
      title={ROCOCO: Robust Outline Completion of Occluded Curvilinear Objects}, 
      author={Ken Zheng and Jaimyn Drake},
      year={2026},
      eprint={2610.29177},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2610.29177}, 
}`,
    },
    {
      id: "viva-la-vida",
      title: "Viva La Vida: Verification and Accumulation Failures in Multi-Agent Proof Search",
      authors: ["Benji Xu", "Ken Zheng", "Noah Han"],
      venue: "NeurIPS 2026",
      venueNote: "Workshop: Mathematical Reasoning and AI",
      year: 2026,
      award: "",
      selected: false,
      tags: [],
      tldr: "Agentic provers without formal verification face critical trust failures, including verifier errors, false approvals, and contamination of lemma libraries with refuted claims.",
      image: "assets/teasers/viva.jpg", // full prover / verifier / lemma-library pipeline
      links: { pdf: "https://arxiv.org/pdf/2610.04829", arxiv: "https://arxiv.org/abs/2610.04829", code: "https://github.com/kenzhengjk/viva-la-vida" },
      bibtex: `@misc{xu2026vivalavidaverification,
      title={Viva La Vida: Verification and Accumulation Failures in Multi-Agent Proof Search}, 
      author={Benji Xu and Ken Zheng and Noah Han},
      year={2026},
      eprint={2610.04829},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2610.04829}, 
}`,
    },
    {
      id: "omega",
      title: "OMEGA: Can LLMs Reason Outside the Box in Math? Evaluating Exploratory, Compositional, and Transformative Generalization",
      authors: ["Yiyou Sun", "Shawn Hu", "Georgia Zhou", "Ken Zheng", "Hannaneh Hajishirzi", "Nouha Dziri", "Dawn Song"],
      venue: "NeurIPS 2025",
      year: 2025,
      award: "",
      selected: false,
      tags: [],
      tldr: "GRPO on LLMs struggle to generalize mathematical reasoning beyond familiar problem-solving strategies.",
      image: "assets/teasers/omega.jpg", // Fig. 10: compositional generalization, before vs. after RL
      video: "",
      links: { pdf: "https://proceedings.neurips.cc/paper_files/paper/2025/file/348f2e8789085e413869722276456f34-Paper-Datasets_and_Benchmarks_Track.pdf", arxiv: "https://arxiv.org/abs/2506.18880", code: "https://github.com/sunblaze-ucb/omega" },
      bibtex: `@inproceedings{NEURIPS2025_348f2e87,
      author = {Sun, Yiyou and Hu, Shawn and Zhou, Georgia and Zheng, Ken and Hajishirzi, Hanna and Dziri, Nouha and Song, Dawn},
      booktitle = {Advances in Neural Information Processing Systems},
      doi = {10.52202/085713-1240},
      editor = {D. Belgrave and C. Zhang and H. Lin and R. Pascanu and P. Koniusz and M. Ghassemi and N. Chen},
      pages = {},
      publisher = {Curran Associates, Inc.},
      title = {OMEGA: Can LLMs Reason Outside the Box in Math? Evaluating Exploratory, Compositional, and Transformative Generalization},
      url = {https://proceedings.neurips.cc/paper_files/paper/2025/file/348f2e8789085e413869722276456f34-Paper-Datasets_and_Benchmarks_Track.pdf},
      volume = {38, Main Conference},
      year = {2025}
}`,
    },
    {
      id: "airtouch",
      title: "AirTouch: A Low-Cost Versatile Visuotactile Feedback System for Enhanced Robotic Teleoperation",
      authors: ["Shoujie Li", "Xingting Li", "Yan Huang", "Ken J. Zheng", "Ran Yu", "Xueqian Wang", "Wenbo Ding"],
      venue: "IROS 2025",
      year: 2025,
      award: "",
      selected: false,
      tags: [],
      tldr: "Enables low-cost visuotactile teleoperation by combining robust hand tracking with closed-loop pneumatic tactile feedback, achieving 91% task success at just $39 hardware cost.",
      image: "assets/teasers/airtouch.jpg",
      video: "assets/teasers/airtouch.mp4",
      // demos cropped from the presentation video, played 1.5× (source speed unknown → task labels, no speed)
      videoLabels: [[0, "method"], [2.32, "finger mapping"], [4.51, "tactile feedback"], [6.69, "teleop · towel fold"]],
      links: { paper: "https://ieeexplore.ieee.org/document/11247770", code: "https://github.com/huangyan28/AirTouch" },
      bibtex: `@INPROCEEDINGS{11247770,
      author={Li, Shoujie and Li, Xingting and Huang, Yan and Zheng, Ken Jiankun and Yu, Ran and Wang, Xueqian and Ding, Wenbo},
      booktitle={2025 IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS)}, 
      title={AirTouch: A Low-Cost Versatile Visuotactile Feedback System for Enhanced Robotic Teleoperation}, 
      year={2025},
      volume={},
      number={},
      pages={15525-15532},
      keywords={Hands;Costs;Service robots;Heuristic algorithms;Pose estimation;Tactile sensors;Pneumatic systems;End effectors;Hardware;Grippers},
      doi={10.1109/IROS60139.2025.11247770}
}`,
    },
  ],
  
  // projects: [
  //   {
  //     title: "tinyvla",
  //     text: "A minimal, hackable vision-language-action policy in ~600 lines of PyTorch.",
  //     tags: ["PyTorch", "VLA"],
  //     image: "",
  //     links: { code: "#", demo: "#" },
  //   },
  // ],

  // type: "education" | "research" | "industry"  (groups in this order)
  experience: [
    { type: "education", org: "UC Berkeley College of Engineering", role: "B.S. Electrical Engineering & Computer Sciences (EECS)", detail: "Doing stuff.", dates: "2023 — 2027", logo: "./assets/img/ucb.webp" },
    { type: "experience", org: "Berkeley AI Research (BAIR)", role: "Undergraduate Researcher", detail: "Advised by Prof. Trevor Darrell: 🦾 and 👀.", dates: "2025 — now", logo: "./assets/img/bair.png" },
    { type: "experience", org: "Meta", role: "Software Engineer Intern, ML", detail: "Facebook Marketplace recommendation systems and Instagram ads ranking.", dates: "Summer 2026", logo: "./assets/img/meta.png" },
    { type: "experience", org: "Simons Institute for the Theory of Computing (SITC)", role: "Undergraduate Researcher", detail: "Advised by Prof. Dawn Song: LLM post-training and evaluation.", dates: "2024 — 2025", logo: "./assets/img/sitc.png" },
    { type: "experience", org: "Smart Sensing & Robotics (SSR)", role: "Visiting Researcher", detail: "Advised by Prof. Wenbo Ding: 🦾 and MARL.", dates: "2024 — 2025", logo: "./assets/img/thu.png" },
    { type: "experience", org: "Microsoft", role: "Machine Learning Intern", detail: `MSR AI for Science: contributed to synthetic data generation and training for <a href="https://www.nature.com/articles/s41467-024-53632-4">TamGen</a>'s compound decoder.`, dates: "Summer 2024", logo: "./assets/img/msft.png" },
  ],

  teaching: [
    { code: "EECS 126", title: "Probability and Random Processes", role: `Co-Head Teaching Assistant with Prof Kannan Ramchandran.`, term: "Spring 2026", url: "https://www2.eecs.berkeley.edu/Courses/EECS126/" },
    { code: "EECS 16A", title: "Foundations of Signals, Dynamical Systems, and Information Processing", role: `Teaching Assistant with Prof Babak Ayazifar.`, term: "Spring - Fall 2025", url: "https://www2.eecs.berkeley.edu/Courses/EE66/" },
  ],

  honors: [
    { year: "2022", title: "Individual Gold (Top 10%)", detail: "IOL (International Linguistics Olympiad) China Nationals" },
    { year: "2022", title: "Team Silver (Next 20%)", detail: "IOL (International Linguistics Olympiad) China Nationals" },
  ],

  service: [
    { year: "2026", title: "Reviewer", detail: "ICRA, IROS, NeurIPS Workshops" },
  ],

  // // Closing line in the footer contact block
  // contact: {
  //   headline: "",
  //   text: "Happy to chat!",
  // },
};
