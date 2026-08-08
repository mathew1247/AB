// Camply & Be.run Dashboard Interactive Logic with Single Course Carousel, Dual-Card Progress Modal & Topic-Wise Daily Coverage Cards Modal

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard application initialized successfully.');

    // Keyboard Shortcuts (Cmd/Ctrl + K for search, Escape for closing modals)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const searchField = document.getElementById('search-input-field');
            if (searchField) searchField.focus();
        }
        if (e.key === 'Escape') {
            closeProgressModal();
            closeCalendarDateModal();
            closeModal();
        }
    });

    // Render initial course if carousel is present
    renderCourse(currentCourseIndex);
});

// Detailed 8 Courses Data Structure with Completed and Pending Topics
const courses = [
    {
        id: 1,
        name: "Python Development",
        tags: "Python • OOP • Flask",
        level: "Intermediate",
        progress: 82,
        completedTopicsCount: 12,
        totalTopicsCount: 15,
        icon: "🐍",
        completed: [
            "Python Basics & Syntax",
            "Variables & Data Types",
            "Functions & Scope",
            "Collections (Lists, Dicts, Sets)",
            "Object-Oriented Programming (OOP)",
            "Inheritance & Polymorphism",
            "File I/O & Exception Handling",
            "List Comprehensions & Generators",
            "Decorators & Context Managers",
            "Virtual Environments & Pip",
            "Package Structure & Modules",
            "Built-in Standard Library"
        ],
        pending: [
            "Flask Web Framework",
            "REST APIs with Flask",
            "Unit Testing & PyTest"
        ]
    },
    {
        id: 2,
        name: "SQL & DBMS",
        tags: "SQL • Joins • Queries",
        level: "Intermediate",
        progress: 68,
        completedTopicsCount: 8,
        totalTopicsCount: 12,
        icon: "🛢️",
        completed: [
            "Relational Database Concepts",
            "SQL SELECT, WHERE, ORDER BY",
            "INNER JOIN & LEFT JOIN",
            "RIGHT JOIN & FULL OUTER JOIN",
            "Aggregate Functions & GROUP BY",
            "HAVING & Filtering Operations",
            "Subqueries & CTEs",
            "Primary Keys & Foreign Keys"
        ],
        pending: [
            "Database Indexing & B-Trees",
            "Query Optimization & EXPLAIN",
            "ACID Transactions & Isolation",
            "Database Normalization (1NF-3NF)"
        ]
    },
    {
        id: 3,
        name: "Data Structures",
        tags: "Arrays • Strings • Hashing",
        level: "Intermediate",
        progress: 56,
        completedTopicsCount: 7,
        totalTopicsCount: 12,
        icon: "⚡",
        completed: [
            "Array Manipulation & Two Pointers",
            "String Searching & Sliding Window",
            "Hash Maps & Hash Sets",
            "Linked Lists (Singly & Doubly)",
            "Stacks & Queues Implementation",
            "Binary Search Algorithms",
            "Sorting Algorithms (Merge & Quick)"
        ],
        pending: [
            "Binary Trees & Traversal",
            "Binary Search Trees (BST)",
            "Heaps & Priority Queues",
            "Graph Representation & BFS/DFS",
            "Dynamic Programming Basics"
        ]
    },
    {
        id: 4,
        name: "JavaScript",
        tags: "ES6 • DOM • Async JavaScript",
        level: "Intermediate",
        progress: 74,
        completedTopicsCount: 9,
        totalTopicsCount: 12,
        icon: "📜",
        completed: [
            "ES6+ Syntax (let, const)",
            "Arrow Functions & Lexical Scope",
            "Array Methods (map, filter, reduce)",
            "Object Destructuring & Spread",
            "DOM Selection & Manipulation",
            "Event Handling & Delegation",
            "Promises & Callback Chains",
            "Async / Await Syntax",
            "Fetch API & Network Requests"
        ],
        pending: [
            "Closures & Scope Chain",
            "Prototypal Inheritance",
            "Event Loop & Microtask Queue"
        ]
    },
    {
        id: 5,
        name: "Frontend Development",
        tags: "HTML • CSS • JavaScript",
        level: "Intermediate",
        progress: 78,
        completedTopicsCount: 11,
        totalTopicsCount: 14,
        icon: "💻",
        completed: [
            "Semantic HTML5 Markup",
            "CSS Flexbox Layouts",
            "CSS Grid Systems",
            "Responsive Media Queries",
            "CSS Variables & Design Tokens",
            "Vanilla JS DOM Manipulation",
            "CSS Animations & Transitions",
            "Form Validation & UX Patterns",
            "Web Accessibility (a11y)",
            "Browser Performance Optimization",
            "Asset Pipeline & Optimization"
        ],
        pending: [
            "State Management Patterns",
            "Single Page Application (SPA)",
            "Build Tools & Bundlers"
        ]
    },
    {
        id: 6,
        name: "Backend Development",
        tags: "Python • Flask • REST APIs",
        level: "Intermediate",
        progress: 48,
        completedTopicsCount: 6,
        totalTopicsCount: 12,
        icon: "⚙️",
        completed: [
            "Client-Server Architecture",
            "HTTP Request Methods & Headers",
            "Flask Application Routing",
            "JSON Request/Response Handling",
            "Environment Variables & Config",
            "Error Handling & HTTP Status Codes"
        ],
        pending: [
            "JWT Authentication & Security",
            "Database ORM (SQLAlchemy)",
            "API Rate Limiting & Throttling",
            "Background Task Queues",
            "Docker Containerization",
            "Cloud Deployment & CI/CD"
        ]
    },
    {
        id: 7,
        name: "REST APIs",
        tags: "HTTP • JSON • API Design",
        level: "Intermediate",
        progress: 61,
        completedTopicsCount: 7,
        totalTopicsCount: 11,
        icon: "🔌",
        completed: [
            "REST Architectural Principles",
            "Resource Naming Conventions",
            "HTTP Verbs (GET, POST, PUT, DELETE)",
            "Status Codes (200, 400, 404, 500)",
            "JSON Schema & Payload Design",
            "Query Parameters & Filtering",
            "API Versioning Strategies"
        ],
        pending: [
            "API Authentication (OAuth 2.0)",
            "CORS & Security Headers",
            "OpenAPI / Swagger Specs",
            "Webhooks & Real-time Events"
        ]
    },
    {
        id: 8,
        name: "System Design",
        tags: "Architecture • Scalability • APIs",
        level: "Advanced",
        progress: 35,
        completedTopicsCount: 4,
        totalTopicsCount: 12,
        icon: "🏗️",
        completed: [
            "Scalability (Vertical vs Horizontal)",
            "Load Balancers & Reverse Proxies",
            "Caching Strategies (Redis/Memcached)",
            "CDN & Static Content Delivery"
        ],
        pending: [
            "Database Sharding & Replication",
            "Microservices vs Monolith Architecture",
            "Message Queues (Kafka, RabbitMQ)",
            "Consistent Hashing & Partitioning",
            "Rate Limiters & API Gateways",
            "CAP Theorem & PACELC Tradeoffs",
            "Distributed File Systems",
            "Real-Time System Design Patterns"
        ]
    }
];

let currentCourseIndex = 0;

// Render course slide inside technical skills card
function renderCourse(index) {
    const course = courses[index];
    if (!course) return;

    const iconEl = document.getElementById('course-icon');
    const titleEl = document.getElementById('course-title');
    const tagsEl = document.getElementById('course-tags');
    const levelEl = document.getElementById('course-level');
    const percentEl = document.getElementById('course-percent');
    const progressFill = document.getElementById('course-progress-fill');
    const topicsEl = document.getElementById('course-topics');
    const indicatorEl = document.getElementById('course-counter-indicator');
    const prevBtn = document.getElementById('prev-course-btn');
    const nextBtn = document.getElementById('next-course-btn');
    const slideWrapper = document.getElementById('course-slide-wrapper');

    if (!slideWrapper) return;

    // Apply smooth fade/slide transition
    slideWrapper.style.opacity = '0';
    slideWrapper.style.transform = 'translateX(10px)';

    setTimeout(() => {
        if (iconEl) iconEl.innerText = course.icon;
        if (titleEl) titleEl.innerText = course.name;
        if (tagsEl) tagsEl.innerText = course.tags;
        if (levelEl) levelEl.innerText = course.level;
        if (percentEl) percentEl.innerText = `${course.progress}% Complete`;
        if (progressFill) progressFill.style.width = `${course.progress}%`;
        if (topicsEl) topicsEl.innerText = `${course.completedTopicsCount} Completed · ${course.pending.length} Pending`;
        if (indicatorEl) indicatorEl.innerText = `${index + 1} / ${courses.length}`;

        // Dynamic link to practice.html with skill and topics
        const continueBtn = document.getElementById('tech-skill-continue-btn');
        if (continueBtn) {
            continueBtn.href = `practice.html?skill=${encodeURIComponent(course.name)}&topics=${encodeURIComponent(course.tags)}`;
        }

        // Disable buttons at boundaries
        if (prevBtn) {
            prevBtn.disabled = (index === 0);
            prevBtn.style.opacity = (index === 0) ? '0.4' : '1';
            prevBtn.style.cursor = (index === 0) ? 'not-allowed' : 'pointer';
        }

        if (nextBtn) {
            nextBtn.disabled = (index === courses.length - 1);
            nextBtn.style.opacity = (index === courses.length - 1) ? '0.4' : '1';
            nextBtn.style.cursor = (index === courses.length - 1) ? 'not-allowed' : 'pointer';
        }

        slideWrapper.style.opacity = '1';
        slideWrapper.style.transform = 'translateX(0)';
    }, 120);
}

function nextCourse() {
    if (currentCourseIndex < courses.length - 1) {
        currentCourseIndex++;
        renderCourse(currentCourseIndex);
    }
}

function prevCourse() {
    if (currentCourseIndex > 0) {
        currentCourseIndex--;
        renderCourse(currentCourseIndex);
    }
}

// Open Progress Modal displaying Dual Cards (Card A: Completed Topics, Card B: Incomplete Topics)
function openProgressModal() {
    const course = courses[currentCourseIndex];
    if (!course) return;

    const modal = document.getElementById('progress-modal');
    const nameEl = document.getElementById('modal-course-name');
    const percentEl = document.getElementById('modal-course-percent');
    const summaryEl = document.getElementById('modal-topics-summary');
    const completedListEl = document.getElementById('modal-completed-list');
    const pendingListEl = document.getElementById('modal-pending-list');

    if (nameEl) nameEl.innerText = course.name;
    if (percentEl) percentEl.innerText = `${course.progress}% Completed`;
    if (summaryEl) summaryEl.innerText = `${course.completedTopicsCount} Completed · ${course.pending.length} Incomplete`;

    // Render Card A: Completed Topics (Light Gold/Beige Card)
    if (completedListEl) {
        completedListEl.innerHTML = course.completed.map(item => `
            <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #1C1C1E; font-weight: 600; padding: 0.35rem 0; border-bottom: 1px solid rgba(28, 28, 30, 0.08);">
                <span style="font-size: 0.95rem;">📄</span> ${item}
            </div>
        `).join('');
    }

    // Render Card B: Incomplete Topics (Sleek Dark Card)
    if (pendingListEl) {
        pendingListEl.innerHTML = course.pending.map(item => `
            <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #E5E5EA; font-weight: 500; padding: 0.35rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                <span style="font-size: 0.95rem; color: #FFCC00;">⚙️</span> ${item}
            </div>
        `).join('');
    }

    if (modal) modal.classList.add('active');
}

function closeProgressModal() {
    const modal = document.getElementById('progress-modal');
    if (modal) modal.classList.remove('active');
}

// Exact Topic-Wise Daily Coverage Dataset for Calendar Dates
const calendarDateTopics = {
    1: {
        dateTitle: "June 1, 2026",
        badgeSummary: "3 Topics Covered",
        cards: [
            {
                title: "Python OOP & Inheritance",
                category: "Python • Intermediate",
                icon: "🐍",
                score: "92% Score",
                badge: "Topic 1 of 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Classes, Method Overriding, Polymorphism"
            },
            {
                title: "SQL INNER & LEFT JOIN Queries",
                category: "Database • Queries",
                icon: "🛢️",
                score: "88% Score",
                badge: "Topic 2 of 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: INNER JOIN, LEFT JOIN, Aggregations"
            },
            {
                title: "Data Structures - Hash Map Lookup",
                category: "DSA • Algorithms",
                icon: "⚡",
                score: "95% Score",
                badge: "Topic 3 of 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Hash Functions, Collision Resolution"
            }
        ]
    },
    22: {
        dateTitle: "June 22, 2026 (Yesterday)",
        badgeSummary: "3 Topics Covered Yesterday",
        cards: [
            {
                title: "Python Generators & Decorators",
                category: "Python • Advanced",
                icon: "🐍",
                score: "89% Score",
                badge: "Yesterday • Topic 1",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Yield, Decorator Wrappers, Closures"
            },
            {
                title: "SQL Grouping & Having Clauses",
                category: "Database • Query Optimization",
                icon: "🛢️",
                score: "94% Score",
                badge: "Yesterday • Topic 2",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: GROUP BY, HAVING, COUNT/SUM/AVG"
            },
            {
                title: "Arrays & Sliding Window Pattern",
                category: "DSA • Problem Solving",
                icon: "⚡",
                score: "86% Score",
                badge: "Yesterday • Topic 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Fixed & Dynamic Subarray Search"
            }
        ]
    },
    23: {
        dateTitle: "June 23, 2026 (Today)",
        badgeSummary: "2 Topics Covered Today",
        cards: [
            {
                title: "JavaScript Promises & Async/Await",
                category: "JavaScript • ES6+",
                icon: "📜",
                score: "95% Score",
                badge: "Today • Topic 1",
                badgeBg: "rgba(66, 133, 244, 0.12)",
                badgeColor: "#4285F4",
                subtopics: "Covered: Event Loop, Microtasks, Async Handling"
            },
            {
                title: "CSS Flexbox & Responsive Grid Systems",
                category: "Frontend • CSS3 Design",
                icon: "💻",
                score: "91% Score",
                badge: "Today • Topic 2",
                badgeBg: "rgba(66, 133, 244, 0.12)",
                badgeColor: "#4285F4",
                subtopics: "Covered: Flex Layouts, Media Queries, Grid Columns"
            }
        ]
    },
    5: {
        dateTitle: "June 5, 2026",
        badgeSummary: "2 Topics Covered",
        cards: [
            {
                title: "Binary Search & Two Pointers",
                category: "DSA • Algorithms",
                icon: "⚡",
                score: "85% Score",
                badge: "Completed ✓",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Sorted Arrays, Target Index Search"
            },
            {
                title: "REST API Design & Verbs",
                category: "REST APIs • Web",
                icon: "🔌",
                score: "90% Score",
                badge: "Completed ✓",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: GET, POST, PUT, DELETE Endpoint Design"
            }
        ]
    },
    17: {
        dateTitle: "June 17, 2026",
        badgeSummary: "1 Scheduled Topic",
        cards: [
            {
                title: "System Design & Caching Architecture",
                category: "System Design • Advanced",
                icon: "🏗️",
                score: "Scheduled 4:00 PM",
                badge: "Scheduled ⏰",
                badgeBg: "rgba(255, 153, 0, 0.15)",
                badgeColor: "#D97706",
                subtopics: "Upcoming: Redis Caching, Load Balancers"
            }
        ]
    },
    19: {
        dateTitle: "June 19, 2026",
        badgeSummary: "1 Scheduled Topic",
        cards: [
            {
                title: "Backend JWT Authentication & Security",
                category: "Backend • Security",
                icon: "⚙️",
                score: "Scheduled 2:30 PM",
                badge: "Scheduled ⏰",
                badgeBg: "rgba(255, 153, 0, 0.15)",
                badgeColor: "#D97706",
                subtopics: "Upcoming: Token Verification & Headers"
            }
        ]
    }
};

function selectCalendarDate(dayNumber) {
    const modal = document.getElementById('calendar-date-modal');
    const titleEl = document.getElementById('date-modal-title');
    const summaryEl = document.getElementById('date-modal-summary');
    const cardsGrid = document.getElementById('date-cards-grid');

    // Generate topic cards dynamically if date not explicitly mapped
    const activity = calendarDateTopics[dayNumber] || {
        dateTitle: `June ${dayNumber}, 2026`,
        badgeSummary: `${dayNumber % 2 === 0 ? '2' : '3'} Topics Covered`,
        cards: dayNumber % 2 === 0 ? [
            {
                title: "Data Structures - Linked List Operations",
                category: "DSA • Algorithms",
                icon: "⚡",
                score: "87% Score",
                badge: "Topic 1 of 2",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Node Traversal & Reversal"
            },
            {
                title: "SQL Subqueries & Nested Queries",
                category: "Database • Queries",
                icon: "🛢️",
                score: "91% Score",
                badge: "Topic 2 of 2",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Correlated Subqueries & CTEs"
            }
        ] : [
            {
                title: "Python Functions & Scope",
                category: "Python • Basics",
                icon: "🐍",
                score: "94% Score",
                badge: "Topic 1 of 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: Global/Local Scope, Lambda"
            },
            {
                title: "JavaScript DOM Selection & Events",
                category: "Frontend • JS",
                icon: "📜",
                score: "89% Score",
                badge: "Topic 2 of 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: querySelector, Event Listeners"
            },
            {
                title: "REST API Status Codes & JSON",
                category: "APIs • Web",
                icon: "🔌",
                score: "88% Score",
                badge: "Topic 3 of 3",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: "Covered: HTTP 200/400/500 Code Specs"
            }
        ]
    };

    if (titleEl) titleEl.innerText = `Topic Coverage for ${activity.dateTitle}`;
    if (summaryEl) summaryEl.innerText = activity.badgeSummary;

    if (cardsGrid) {
        cardsGrid.innerHTML = activity.cards.map(card => `
            <div style="background: #FFFFFF; border-radius: 20px; padding: 1.4rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid var(--berun-border); display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
                <div>
                    <!-- Top Row: Icon + Badge -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: #F7F3EE; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                            ${card.icon}
                        </div>
                        <span style="background: ${card.badgeBg}; color: ${card.badgeColor}; font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill);">
                            ${card.badge}
                        </span>
                    </div>

                    <!-- Title & Subtitle -->
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: #1C1C1E; line-height: 1.2;">
                        ${card.title}
                    </h4>
                    <div style="font-size: 0.78rem; font-weight: 600; color: #666460; margin-top: 0.3rem;">
                        ${card.category}
                    </div>
                </div>

                <!-- Bottom Row: Subtopics + Practice Button -->
                <div style="border-top: 1px solid #F0EAEE; padding-top: 0.8rem; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: #1C1C1E;">${card.score}</div>
                        <div style="font-size: 0.7rem; color: #666460; font-weight: 600;">${card.subtopics}</div>
                    </div>
                    <a href="practice.html" class="berun-btn-dark" style="text-decoration: none; font-size: 0.75rem; padding: 0.4rem 0.9rem;">
                        Practice →
                    </a>
                </div>
            </div>
        `).join('');
    }

    if (modal) modal.classList.add('active');
}

function closeCalendarDateModal() {
    const modal = document.getElementById('calendar-date-modal');
    if (modal) modal.classList.remove('active');
}

// Active Sidebar Navigation Icon
function setActiveSidebar(el, sectionName) {
    document.querySelectorAll('.berun-nav-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    showToast(`Navigated to ${sectionName}`);
}

// Generic Modal Handlers
function openModal(title, description) {
    const modal = document.getElementById('action-modal');
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');

    if (title) titleEl.innerText = title;
    if (description) descEl.innerText = description;

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('action-modal');
    if (modal) modal.classList.remove('active');
}

// Filter Search Handler
function handleSearch(query) {
    if (!query) return;
    console.log('Searching health data for:', query);
}

// Toast Notification System
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}

// Monthly Topic Progress Graph Switcher
const topicGraphDatasets = {
    'dsa': {
        name: 'Data Structures Mastery',
        peak: '92% Peak Accuracy',
        lineD: 'M 30 90 Q 130 65, 230 40 T 370 15',
        areaD: 'M 30 90 Q 130 65, 230 40 T 370 15 L 370 115 L 30 115 Z',
        nodes: [{ cx: 30, cy: 90, val: '45%' }, { cx: 140, cy: 65, val: '62%' }, { cx: 250, cy: 40, val: '78%' }, { cx: 370, cy: 15, val: '92%' }],
        questions: '142 Solved',
        accuracy: '88.4%',
        streak: '18 Days 🔥'
    },
    'algo': {
        name: 'Algorithms & Problem Solving',
        peak: '88% Peak Accuracy',
        lineD: 'M 30 98 Q 130 75, 230 48 T 370 22',
        areaD: 'M 30 98 Q 130 75, 230 48 T 370 22 L 370 115 L 30 115 Z',
        nodes: [{ cx: 30, cy: 98, val: '40%' }, { cx: 140, cy: 75, val: '55%' }, { cx: 250, cy: 48, val: '72%' }, { cx: 370, cy: 22, val: '88%' }],
        questions: '118 Solved',
        accuracy: '85.0%',
        streak: '14 Days 🔥'
    },
    'sql': {
        name: 'SQL & Database Queries',
        peak: '95% Peak Accuracy',
        lineD: 'M 30 85 Q 130 55, 230 32 T 370 10',
        areaD: 'M 30 85 Q 130 55, 230 32 T 370 10 L 370 115 L 30 115 Z',
        nodes: [{ cx: 30, cy: 85, val: '50%' }, { cx: 140, cy: 55, val: '68%' }, { cx: 250, cy: 32, val: '84%' }, { cx: 370, cy: 10, val: '95%' }],
        questions: '96 Solved',
        accuracy: '92.1%',
        streak: '21 Days 🔥'
    },
    'sys': {
        name: 'System Design Architecture',
        peak: '82% Peak Accuracy',
        lineD: 'M 30 105 Q 130 82, 230 58 T 370 30',
        areaD: 'M 30 105 Q 130 82, 230 58 T 370 30 L 370 115 L 30 115 Z',
        nodes: [{ cx: 30, cy: 105, val: '30%' }, { cx: 140, cy: 82, val: '48%' }, { cx: 250, cy: 58, val: '65%' }, { cx: 370, cy: 30, val: '82%' }],
        questions: '64 Solved',
        accuracy: '80.5%',
        streak: '9 Days 🔥'
    },
    'py': {
        name: 'Python & Core OOP',
        peak: '96% Peak Accuracy',
        lineD: 'M 30 75 Q 130 48, 230 28 T 370 8',
        areaD: 'M 30 75 Q 130 48, 230 28 T 370 8 L 370 115 L 30 115 Z',
        nodes: [{ cx: 30, cy: 75, val: '58%' }, { cx: 140, cy: 48, val: '74%' }, { cx: 250, cy: 28, val: '86%' }, { cx: 370, cy: 8, val: '96%' }],
        questions: '156 Solved',
        accuracy: '94.2%',
        streak: '25 Days 🔥'
    }
};

function switchTopicGraph(topicKey, btn) {
    const data = topicGraphDatasets[topicKey];
    if (!data) return;

    // Toggle active tab buttons
    document.querySelectorAll('.topic-graph-tab').forEach(b => {
        b.style.background = '#EAE3D9';
        b.style.color = '#666460';
        b.classList.remove('active');
    });

    if (btn) {
        btn.style.background = '#1C1C1E';
        btn.style.color = '#FFFFFF';
        btn.classList.add('active');
    }

    // Update Header Text & Stats
    const topicNameEl = document.getElementById('graph-topic-name');
    const peakScoreEl = document.getElementById('graph-peak-score');
    const statQuestionsEl = document.getElementById('stat-questions');
    const statAccuracyEl = document.getElementById('stat-accuracy');
    const statStreakEl = document.getElementById('stat-streak');

    if (topicNameEl) topicNameEl.innerText = data.name;
    if (peakScoreEl) peakScoreEl.innerText = data.peak;
    if (statQuestionsEl) statQuestionsEl.innerText = data.questions;
    if (statAccuracyEl) statAccuracyEl.innerText = data.accuracy;
    if (statStreakEl) statStreakEl.innerText = data.streak;

    // Update SVG Paths
    const linePath = document.getElementById('graph-line-path');
    const areaPath = document.getElementById('graph-area-path');

    if (linePath) linePath.setAttribute('d', data.lineD);
    if (areaPath) areaPath.setAttribute('d', data.areaD);

    // Update Nodes & Text
    const months = ['may', 'june', 'july', 'aug'];
    months.forEach((m, idx) => {
        const circle = document.getElementById(`node-${m}`);
        const text = document.getElementById(`text-${m}`);
        const nodeData = data.nodes[idx];

        if (circle && nodeData) {
            circle.setAttribute('cy', nodeData.cy);
        }
        if (text && nodeData) {
            text.setAttribute('y', nodeData.cy - 10);
            text.innerText = nodeData.val;
        }
    });
}

// Button Navigation Controller for Monthly Topic Progress Card
let currentTopicGraphIndex = 0;
const topicGraphKeys = ['dsa', 'algo', 'sql', 'sys', 'py'];

function renderTopicGraphSlide(index) {
    const key = topicGraphKeys[index];
    if (!key) return;

    const wrapper = document.getElementById('topic-graph-slide-wrapper');
    const counterEl = document.getElementById('topic-graph-counter');
    const prevBtn = document.getElementById('prev-topic-graph-btn');
    const nextBtn = document.getElementById('next-topic-graph-btn');

    if (wrapper) {
        wrapper.style.opacity = '0';
        wrapper.style.transform = 'translateX(10px)';
    }

    setTimeout(() => {
        // Find matching tab button
        const targetTab = document.querySelector(`.topic-graph-tab[data-key="${key}"]`);
        switchTopicGraph(key, targetTab);

        if (counterEl) counterEl.innerText = `${index + 1} / ${topicGraphKeys.length}`;

        if (prevBtn) {
            prevBtn.disabled = (index === 0);
            prevBtn.style.opacity = (index === 0) ? '0.4' : '1';
            prevBtn.style.cursor = (index === 0) ? 'not-allowed' : 'pointer';
        }

        if (nextBtn) {
            nextBtn.disabled = (index === topicGraphKeys.length - 1);
            nextBtn.style.opacity = (index === topicGraphKeys.length - 1) ? '0.4' : '1';
            nextBtn.style.cursor = (index === topicGraphKeys.length - 1) ? 'not-allowed' : 'pointer';
        }

        if (wrapper) {
            wrapper.style.opacity = '1';
            wrapper.style.transform = 'translateX(0)';
        }
    }, 120);
}

function nextTopicGraph() {
    if (currentTopicGraphIndex < topicGraphKeys.length - 1) {
        currentTopicGraphIndex++;
        renderTopicGraphSlide(currentTopicGraphIndex);
    }
}

function prevTopicGraph() {
    if (currentTopicGraphIndex > 0) {
        currentTopicGraphIndex--;
        renderTopicGraphSlide(currentTopicGraphIndex);
    }
}

// Training Days Month Navigation Logic (January to December 2026)
const trainingMonths = [
    {
        name: 'January 2026',
        startDayOffset: 3, // Thursday (M=0, T=1, W=2, T=3, F=4, S=5, S=6)
        daysInMonth: 31,
        doneDays: [2, 5, 8, 12, 15, 19, 22, 26, 29],
        scheduledDays: [14, 28],
        currentDay: null
    },
    {
        name: 'February 2026',
        startDayOffset: 6, // Sunday
        daysInMonth: 28,
        doneDays: [3, 6, 10, 13, 17, 20, 24, 27],
        scheduledDays: [12, 25],
        currentDay: null
    },
    {
        name: 'March 2026',
        startDayOffset: 6, // Sunday
        daysInMonth: 31,
        doneDays: [2, 6, 9, 13, 16, 20, 23, 27, 30],
        scheduledDays: [11, 25],
        currentDay: null
    },
    {
        name: 'April 2026',
        startDayOffset: 2, // Wednesday
        daysInMonth: 30,
        doneDays: [1, 4, 8, 11, 15, 18, 22, 25, 29],
        scheduledDays: [10, 24],
        currentDay: null
    },
    {
        name: 'May 2026',
        startDayOffset: 4, // Friday
        daysInMonth: 31,
        doneDays: [2, 5, 9, 12, 16, 21, 25, 29],
        scheduledDays: [14, 28],
        currentDay: null
    },
    {
        name: 'June 2026',
        startDayOffset: 0, // Monday
        daysInMonth: 30,
        doneDays: [1, 5, 8, 12, 15, 19, 22, 26, 28],
        scheduledDays: [17, 19],
        currentDay: 23
    },
    {
        name: 'July 2026',
        startDayOffset: 2, // Wednesday
        daysInMonth: 31,
        doneDays: [3, 7, 10, 14, 18, 21, 25, 28],
        scheduledDays: [11, 23],
        currentDay: null
    },
    {
        name: 'August 2026',
        startDayOffset: 5, // Saturday
        daysInMonth: 31,
        doneDays: [1, 4, 7, 11, 14, 18, 22, 25, 29],
        scheduledDays: [15, 30],
        currentDay: 8
    },
    {
        name: 'September 2026',
        startDayOffset: 1, // Tuesday
        daysInMonth: 30,
        doneDays: [2, 6, 9, 13, 16, 20, 23, 27],
        scheduledDays: [10, 24],
        currentDay: null
    },
    {
        name: 'October 2026',
        startDayOffset: 3, // Thursday
        daysInMonth: 31,
        doneDays: [2, 5, 9, 12, 16, 20, 23, 27, 30],
        scheduledDays: [14, 28],
        currentDay: null
    },
    {
        name: 'November 2026',
        startDayOffset: 6, // Sunday
        daysInMonth: 30,
        doneDays: [3, 6, 10, 13, 17, 20, 24, 27],
        scheduledDays: [12, 25],
        currentDay: null
    },
    {
        name: 'December 2026',
        startDayOffset: 1, // Tuesday
        daysInMonth: 31,
        doneDays: [1, 4, 8, 11, 15, 18, 22, 25, 29],
        scheduledDays: [10, 24],
        currentDay: null
    }
];

let currentTrainingMonthIndex = 0; // Fixed to January 2026

// Candidates Dataset Map (Derived from candidates.json)
const candidateDatasetMap = {
    "CAND-001": {
        id: "CAND-001",
        name: "Sarah Johnson",
        jobRole: "Senior Data Engineer",
        yearsExperience: 9,
        education: "MS Computer Science",
        status: "COMPLETED",
        missions: [
            { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
            { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
            { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 2 },
            { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 4 },
            { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 1 },
            { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
            { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 2 },
            { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 3 },
            { day: 29, title: "Monitoring, Logging & Observability", skipped: true },
            { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 }
        ],
        signals: { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 }
    },
    "CAND-002": {
        id: "CAND-002",
        name: "Alex Turner",
        jobRole: "Backend Software Engineer",
        yearsExperience: 5,
        education: "B.Tech Computer Science",
        status: "COMPLETED",
        missions: [
            { day: 7, title: "Embeddings Explained", passed: true, attempts: 3 },
            { day: 8, title: "Vector Databases Overview", passed: true, attempts: 2 },
            { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 4 },
            { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 5 },
            { day: 13, title: "Function Calling & Structured Outputs", passed: true, attempts: 4 },
            { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 1 },
            { day: 18, title: "Streaming Responses", passed: true, attempts: 1 },
            { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 3 },
            { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 1 },
            { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 2 }
        ],
        signals: { commitDays: 22, missionsCompleted: 29, missionsFirstTry: 10 }
    },
    "CAND-003": {
        id: "CAND-003",
        name: "Emily Chen",
        jobRole: "AI Engineer",
        yearsExperience: 6,
        education: "MS Artificial Intelligence",
        status: "COMPLETED",
        missions: [
            { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
            { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
            { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 1 },
            { day: 11, title: "RAG End-to-End & LLM API Basics", passed: true, attempts: 1 },
            { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 1 },
            { day: 13, title: "Function Calling & Structured Outputs", passed: true, attempts: 1 },
            { day: 21, title: "LangChain Agents", passed: true, attempts: 1 },
            { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 1 },
            { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 1 },
            { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 }
        ],
        signals: { commitDays: 31, missionsCompleted: 31, missionsFirstTry: 30 }
    },
    "CAND-004": {
        id: "CAND-004",
        name: "David Miller",
        jobRole: "Business Analyst",
        yearsExperience: 8,
        education: "MBA",
        status: "COMPLETED",
        missions: [
            { day: 7, title: "Embeddings Explained", passed: true, attempts: 4 },
            { day: 8, title: "Vector Databases Overview", passed: true, attempts: 5 },
            { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 5 },
            { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 3 },
            { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 2 },
            { day: 20, title: "Conversation Memory & Context Management", passed: true, attempts: 3 },
            { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 4 },
            { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 5 },
            { day: 28, title: "Docker & Kubernetes Deployment", skipped: true },
            { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 2 }
        ],
        signals: { commitDays: 18, missionsCompleted: 28, missionsFirstTry: 6 }
    },
    "CAND-005": {
        id: "CAND-005",
        name: "Michael Brown",
        jobRole: "DevOps Engineer",
        yearsExperience: 10,
        education: "B.Tech Information Technology",
        status: "COMPLETED",
        missions: [
            { day: 7, title: "Embeddings Explained", passed: true, attempts: 2 },
            { day: 8, title: "Vector Databases Overview", passed: true, attempts: 2 },
            { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 2 },
            { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 4 },
            { day: 18, title: "Streaming Responses", passed: true, attempts: 1 },
            { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
            { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 3 },
            { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 1 },
            { day: 29, title: "Monitoring, Logging & Observability", passed: true, attempts: 1 },
            { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 }
        ],
        signals: { commitDays: 30, missionsCompleted: 31, missionsFirstTry: 22 }
    }
};

// Helper: Get candidate from URL parameter or localStorage
function getActiveCandidate() {
    const urlParams = new URLSearchParams(window.location.search);
    let candId = urlParams.get('candidateId') || localStorage.getItem('selectedCandidateId') || 'CAND-001';

    // Normalize short format e.g. "001" -> "CAND-001"
    if (!candId.startsWith('CAND-')) {
        candId = 'CAND-' + candId;
    }

    if (candidateDatasetMap[candId]) {
        return candidateDatasetMap[candId];
    }

    // Dynamic fallback candidate generator for 006 to 020
    const numStr = candId.replace('CAND-', '');
    const num = parseInt(numStr, 10) || 1;
    const names = [
        "Sarah Johnson", "Alex Turner", "Emily Chen", "David Miller", "Michael Brown",
        "Wendy Foster", "Ethan Brooks", "Harold Whitfield", "Zara Ahmadi", "Gerald Combs",
        "Mia Alvarez", "Chen Wei", "Ravi Patel", "Bethany Cole", "Noah Kim",
        "Isabella Rossi", "Tyler Brooks", "Diane Foster", "Frank DeLuca", "Priyanka Sharma"
    ];
    const roles = [
        "Senior Data Engineer", "Backend Software Engineer", "AI Engineer", "Business Analyst", "DevOps Engineer",
        "Marketing Manager", "CS Intern", "Distinguished Engineer", "AI Specialist", "IT Support Specialist",
        "UX Researcher", "Mobile Developer", "Software Engineer", "HR Manager", "Principal Architect",
        "Software Engineer", "Junior Developer", "AI Engineer", "Systems Engineer", "Full Stack Developer"
    ];

    const idx = (num - 1) % names.length;
    return {
        id: candId,
        name: names[idx],
        jobRole: roles[idx],
        yearsExperience: (num * 2) % 15 + 1,
        education: "B.Tech Computer Science",
        status: "COMPLETED",
        missions: [
            { day: 1, title: "Environment Setup", passed: true, attempts: 1 },
            { day: 5, title: "Data Foundations", passed: true, attempts: 1 },
            { day: 7, title: "Embeddings Explained", passed: true, attempts: 2 },
            { day: 8, title: "Vector Databases", passed: true, attempts: 1 },
            { day: 12, title: "Prompt Engineering", passed: true, attempts: 3 },
            { day: 16, title: "API Integration", passed: true, attempts: 1 },
            { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
            { day: 28, title: "Kubernetes Deployment", passed: true, attempts: 1 },
            { day: 31, title: "Capstone Project", passed: true, attempts: 1 }
        ],
        signals: { commitDays: 25, missionsCompleted: 28, missionsFirstTry: 18 }
    };
}

function renderTrainingMonth() {
    const monthData = trainingMonths[currentTrainingMonthIndex];
    if (!monthData) return;

    const labelEl = document.getElementById('training-month-label');
    const gridEl = document.getElementById('berun-calendar-grid');
    const prevBtn = document.getElementById('prev-month-btn');
    const nextBtn = document.getElementById('next-month-btn');

    if (labelEl) labelEl.innerText = monthData.name;

    if (prevBtn) {
        prevBtn.disabled = currentTrainingMonthIndex === 0;
        prevBtn.style.opacity = currentTrainingMonthIndex === 0 ? '0.3' : '1';
        prevBtn.style.cursor = currentTrainingMonthIndex === 0 ? 'not-allowed' : 'pointer';
    }

    if (nextBtn) {
        nextBtn.disabled = currentTrainingMonthIndex === trainingMonths.length - 1;
        nextBtn.style.opacity = currentTrainingMonthIndex === trainingMonths.length - 1 ? '0.3' : '1';
        nextBtn.style.cursor = currentTrainingMonthIndex === trainingMonths.length - 1 ? 'not-allowed' : 'pointer';
    }

    // Active Candidate Details Integration
    const candidate = getActiveCandidate();

    const greetingTitleEl = document.getElementById('greeting-title');
    if (greetingTitleEl) {
        greetingTitleEl.innerText = `Hi, ${candidate.name}!`;
    }
    const greetingDescEl = greetingTitleEl ? greetingTitleEl.nextElementSibling : null;
    if (greetingDescEl) {
        greetingDescEl.innerText = `${candidate.jobRole} • ${candidate.yearsExperience} Yrs Exp • ID: ${candidate.id}`;
    }

    const statQuestionsEl = document.getElementById('stat-questions');
    if (statQuestionsEl) statQuestionsEl.innerText = `${candidate.signals.missionsCompleted} Solved`;

    const statStreakEl = document.getElementById('stat-streak');
    if (statStreakEl) statStreakEl.innerText = `${candidate.signals.commitDays} Days 🔥`;

    const statAccuracyEl = document.getElementById('stat-accuracy');
    if (statAccuracyEl) {
        const acc = Math.round((candidate.signals.missionsFirstTry / Math.max(candidate.signals.missionsCompleted, 1)) * 100);
        statAccuracyEl.innerText = `${acc}%`;
    }

    if (gridEl) {
        let html = `
            <span class="berun-cal-day-label">M</span>
            <span class="berun-cal-day-label">T</span>
            <span class="berun-cal-day-label">W</span>
            <span class="berun-cal-day-label">T</span>
            <span class="berun-cal-day-label">F</span>
            <span class="berun-cal-day-label">S</span>
            <span class="berun-cal-day-label">S</span>
        `;

        // Empty offset cells for starting day
        for (let i = 0; i < monthData.startDayOffset; i++) {
            html += `<span class="berun-cal-date-cell" style="opacity: 0.15; cursor: default;"></span>`;
        }

        // Days of month
        for (let day = 1; day <= monthData.daysInMonth; day++) {
            let classes = 'berun-cal-date-cell';
            let inlineStyle = '';

            const mission = candidate.missions.find(m => m.day === day);

            if (mission) {
                if (mission.passed) {
                    classes += ' done';
                } else if (mission.skipped) {
                    classes += ' scheduled';
                } else {
                    classes += ' scheduled';
                }
            } else if (monthData.doneDays.includes(day)) {
                classes += ' done';
            } else if (monthData.scheduledDays.includes(day)) {
                classes += ' scheduled';
            }

            if (monthData.currentDay === day) {
                inlineStyle = 'border: 1px solid #8E8E93;';
            }

            const titleText = mission ? `${mission.title} (${mission.passed ? 'Passed' : mission.skipped ? 'Skipped' : 'Attempted'})` : `Day ${day}`;

            html += `<span class="${classes}" ${inlineStyle ? `style="${inlineStyle}"` : ''} onclick="selectCalendarDate(${day})" title="${titleText}">${day}</span>`;
        }

        gridEl.innerHTML = html;
    }
}

function selectCalendarDate(dayNumber) {
    const modal = document.getElementById('calendar-date-modal');
    const titleEl = document.getElementById('date-modal-title');
    const summaryEl = document.getElementById('date-modal-summary');
    const cardsGrid = document.getElementById('date-cards-grid');

    const candidate = getActiveCandidate();
    const monthData = trainingMonths[currentTrainingMonthIndex] || trainingMonths[1];

    const mission = candidate.missions.find(m => m.day === dayNumber);

    const activity = {
        dateTitle: `${monthData.name.split(' ')[0]} ${dayNumber}, 2026 — ${candidate.name} (${candidate.id})`,
        badgeSummary: mission ? (mission.passed ? `Passed • ${mission.attempts} attempt${mission.attempts > 1 ? 's' : ''}` : mission.skipped ? 'Skipped Mission' : 'Attempted') : 'Practice Day',
        cards: mission ? [
            {
                title: mission.title,
                category: `Candidate Mission • Day ${mission.day}`,
                icon: mission.passed ? "🎯" : "⚙️",
                score: mission.passed ? "Passed ✓" : "Skipped",
                badge: mission.passed ? `Passed (${mission.attempts} Att)` : "Skipped",
                badgeBg: mission.passed ? "rgba(46, 125, 50, 0.12)" : "rgba(255, 153, 0, 0.15)",
                badgeColor: mission.passed ? "#2E7D32" : "#D97706",
                subtopics: `Candidate: ${candidate.name} (${candidate.jobRole})`
            }
        ] : [
            {
                title: `Day ${dayNumber} General Practice Session`,
                category: "AI Engineering • Practice",
                icon: "⚡",
                score: "Completed",
                badge: "Practice",
                badgeBg: "rgba(46, 125, 50, 0.12)",
                badgeColor: "#2E7D32",
                subtopics: `Candidate: ${candidate.name}`
            }
        ]
    };

    if (titleEl) titleEl.innerText = activity.dateTitle;
    if (summaryEl) summaryEl.innerText = activity.badgeSummary;

    if (cardsGrid) {
        cardsGrid.innerHTML = activity.cards.map(card => `
            <div style="background: #FFFFFF; border-radius: 20px; padding: 1.4rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid var(--berun-border); display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: #F7F3EE; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                            ${card.icon}
                        </div>
                        <span style="background: ${card.badgeBg}; color: ${card.badgeColor}; font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill);">
                            ${card.badge}
                        </span>
                    </div>

                    <h4 style="font-size: 1.05rem; font-weight: 800; color: #1C1C1E; line-height: 1.2;">
                        ${card.title}
                    </h4>
                    <p style="font-size: 0.78rem; color: #666460; font-weight: 600; margin-top: 0.25rem;">
                        ${card.category}
                    </p>
                    <p style="font-size: 0.75rem; color: #1C1C1E; font-weight: 700; margin-top: 0.6rem;">
                        ${card.subtopics}
                    </p>
                </div>
            </div>
        `).join('');
    }

    if (modal) {
        modal.classList.add('active');
    }
}

function prevTrainingMonth() {
    if (currentTrainingMonthIndex > 0) {
        currentTrainingMonthIndex--;
        renderTrainingMonth();
    }
}

function nextTrainingMonth() {
    if (currentTrainingMonthIndex < trainingMonths.length - 1) {
        currentTrainingMonthIndex++;
        renderTrainingMonth();
    }
}

// Initialize calendar rendering on load
window.addEventListener('DOMContentLoaded', () => {
    renderTrainingMonth();
});
