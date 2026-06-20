package com.StudentAiBackend.StudentAiLifeGPS.planner;

import com.StudentAiBackend.StudentAiLifeGPS.entity.User;
import com.StudentAiBackend.StudentAiLifeGPS.entity.UserGoal;
import com.StudentAiBackend.StudentAiLifeGPS.entity.UserSchedule;
import com.StudentAiBackend.StudentAiLifeGPS.entity.UserSkill;
import com.StudentAiBackend.StudentAiLifeGPS.entity.RoadmapNode;
import com.StudentAiBackend.StudentAiLifeGPS.entity.DailyTask;
import com.StudentAiBackend.StudentAiLifeGPS.entity.DailyTaskModule;
import com.StudentAiBackend.StudentAiLifeGPS.entity.ModuleMessage;
import com.StudentAiBackend.StudentAiLifeGPS.entity.StudySession;
import com.StudentAiBackend.StudentAiLifeGPS.entity.UserNodeProgress;
import com.StudentAiBackend.StudentAiLifeGPS.repository.UserGoalRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.UserScheduleRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.UserSkillRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.RoadmapNodeRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.UserRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.UserNodeProgressRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.DailyTaskRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.DailyTaskModuleRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.ModuleMessageRepository;
import com.StudentAiBackend.StudentAiLifeGPS.repository.StudySessionRepository;
import com.StudentAiBackend.StudentAiLifeGPS.service.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class PlannerService {

    private final UserGoalRepository userGoalRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserScheduleRepository userScheduleRepository;
    private final RoadmapNodeRepository roadmapNodeRepository;
    private final UserNodeProgressRepository userNodeProgressRepository;
    private final UserRepository userRepository;
    private final DailyTaskRepository dailyTaskRepository;
    private final DailyTaskModuleRepository dailyTaskModuleRepository;
    private final ModuleMessageRepository moduleMessageRepository;
    private final StudySessionRepository studySessionRepository;
    private final ProfileService profileService;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}")
    private String groqApiKey;



    @Transactional
    public void saveOnboarding(User user, PlannerRequest request) {
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("[PlannerService] Beginning saveOnboarding execution for user: " + persistentUser.getUsername());
        try {
            userGoalRepository.deleteByUser(persistentUser);
            System.out.println("[PlannerService] Deleted existing user goals.");
            userSkillRepository.deleteByUser(persistentUser);
            System.out.println("[PlannerService] Deleted existing user skills.");
            userScheduleRepository.deleteByUser(persistentUser);
            System.out.println("[PlannerService] Deleted existing user schedules.");
            userNodeProgressRepository.deleteByUser(persistentUser);
            System.out.println("[PlannerService] Deleted existing user node progress.");
            roadmapNodeRepository.deleteByUser(persistentUser);
            System.out.println("[PlannerService] Deleted existing user roadmap nodes.");
        } catch (Exception e) {
            System.err.println("[PlannerService] Error during deletion cleanup: " + e.getMessage());
            throw new RuntimeException("Deletion cleanup failed: " + e.getMessage(), e);
        }

        List<String> goals = request.getGoals() != null ? request.getGoals() : Collections.emptyList();
        String primaryGoal = goals.isEmpty() ? "Software Development" : goals.get(0);

        if (request.getGoals() != null) {
            for (String goalName : request.getGoals()) {
                UserGoal goal = new UserGoal();
                goal.setUser(persistentUser);
                goal.setGoalName(goalName);
                userGoalRepository.save(goal);
            }
            System.out.println("[PlannerService] Saved new user goals: " + goals);
        }

        List<String> skillNames = new ArrayList<>();
        if (request.getSkills() != null) {
            for (PlannerRequest.SkillDto skillDto : request.getSkills()) {
                UserSkill skill = new UserSkill();
                skill.setUser(persistentUser);
                skill.setSkillName(skillDto.getSkillName());
                skill.setCurrentLevel(skillDto.getCurrentLevel());
                skill.setTargetLevel(skillDto.getTargetLevel());
                skill.setStatus(skillDto.getStatus() != null ? skillDto.getStatus() : "Not started");
                userSkillRepository.save(skill);
                skillNames.add(skillDto.getSkillName());
            }
            System.out.println("[PlannerService] Saved new user skills: " + skillNames);
        }

        if (request.getSchedule() != null) {
            for (PlannerRequest.ScheduleDto scheduleDto : request.getSchedule()) {
                UserSchedule schedule = new UserSchedule();
                schedule.setUser(persistentUser);
                schedule.setDay(scheduleDto.getDay());
                schedule.setAvailableHours(scheduleDto.getAvailableHours());
                userScheduleRepository.save(schedule);
            }
            System.out.println("[PlannerService] Saved new user schedules.");
        }

        // Save extra fields on User object
        persistentUser.setTargetCareer(primaryGoal);
        persistentUser.setTargetCompletionDate(request.getDeadline() != null ? request.getDeadline() : LocalDate.now().plusWeeks(12).toString());
        persistentUser.setLearningPreferences(request.getLearningPreferences() != null ? new ArrayList<>(request.getLearningPreferences()) : new ArrayList<>());
        
        List<String> projectList;
        if (request.getProfile() != null && request.getProfile().containsKey("projectsInterested")) {
            projectList = new ArrayList<>((List<String>) request.getProfile().get("projectsInterested"));
        } else {
            projectList = new ArrayList<>(List.of(primaryGoal + " Analytics Dashboard", "Microservice Router", "Integrated CLI tool"));
        }
        persistentUser.setInterestedProjects(projectList);
        persistentUser.setActiveMission("Complete assessment for " + primaryGoal);
        persistentUser.setDiagnosticComplete(false); // Reset diagnostics for the new career path

        try {
            System.out.println("SAVE PROFILE");
            System.out.println(persistentUser);
            System.out.println(persistentUser.getTargetCareer());
            System.out.println(persistentUser.getTargetCompletionDate());
            System.out.println(persistentUser.getLearningPreferences());
            System.out.println(persistentUser.getInterestedProjects());
            System.out.println(persistentUser.getStrengths());
            System.out.println(persistentUser.getWeaknesses());

            User saved = userRepository.save(persistentUser);
            System.out.println(saved);
            System.out.println("[PlannerService] User details saved successfully: targetCareer=" + primaryGoal);
        } catch (Exception e) {
            System.err.println("User save failed: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        // Generate roadmap nodes dynamically using Groq
        System.out.println("[PlannerService] Generating dynamic roadmap nodes via LLM...");
        generateRoadmapNodes(persistentUser, skillNames, primaryGoal);

        // Generate daily tasks and modules dynamically
        generateDailyTasks(persistentUser);

        System.out.println("[PlannerService] saveOnboarding finished successfully.");
        System.out.println("SUCCESS");
    }

    private void generateRoadmapNodes(User user, List<String> skillNames, String primaryGoal) {
        String prompt = String.format(
            "Design a structured learning path consisting of exactly 5 milestones for a student learning: %s.\n" +
            "Target Career: %s.\n" +
            "For each node, define:\n" +
            "- Node ID (lowercase, alphanumeric unique within list, e.g. 'python', 'oop', 'dsa')\n" +
            "- Title\n" +
            "- Difficulty (Beginner, Intermediate, Advanced)\n" +
            "- Hours (Integer estimate)\n" +
            "- Description\n" +
            "- XP Reward (Integer, e.g. 100, 200, 300)\n" +
            "- Resources (List of documentation or tutorial links)\n" +
            "- Projects (List of mini project goals)\n" +
            "- Interview Questions (List of questions)\n" +
            "- Mini Challenges (List of challenges)\n" +
            "Format the response strictly as valid JSON matching this exact layout:\n" +
            "[\n" +
            "  {\n" +
            "    \"nodeId\": \"python-basics\",\n" +
            "    \"title\": \"Python Basics\",\n" +
            "    \"difficulty\": \"Beginner\",\n" +
            "    \"hours\": 10,\n" +
            "    \"description\": \"Master core syntax variables and structures\",\n" +
            "    \"xpReward\": 150,\n" +
            "    \"resources\": [\"https://docs.python.org/3/\"],\n" +
            "    \"projects\": [\"CLI calculator\"],\n" +
            "    \"interviewQuestions\": [\"Explain difference between list and tuple\"],\n" +
            "    \"miniChallenges\": [\"Solve Fibonacci recursion\"]\n" +
            "  }\n" +
            "]\n" +
            "Return ONLY the valid JSON list.",
            String.join(", ", skillNames),
            primaryGoal
        );

        List<Map<String, Object>> gResult = null;
        if (groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("${")) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(groqApiKey);

                Map<String, Object> msg = new HashMap<>();
                msg.put("role", "user");
                msg.put("content", prompt);

                Map<String, Object> body = new HashMap<>();
                body.put("model", "llama-3.3-70b-versatile");
                body.put("messages", List.of(msg));
                body.put("temperature", 0.2);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                System.out.println("CALLING GROQ");
                ResponseEntity<Map> responseEntity = restTemplate.postForEntity("https://api.groq.com/openai/v1/chat/completions", request, Map.class);
                Map<?, ?> response = responseEntity.getBody();
                System.out.println("GROQ RESPONSE");
                System.out.println(response);

                if (response != null && response.containsKey("choices")) {
                    List<?> choices = (List<?>) response.get("choices");
                    if (!choices.isEmpty()) {
                        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                        Map<?, ?> messageObj = (Map<?, ?>) choice.get("message");
                        String content = (String) messageObj.get("content");
                        if (content != null) {
                            int startIdx = content.indexOf('[');
                            int endIdx = content.lastIndexOf(']');
                            if (startIdx != -1 && endIdx != -1 && endIdx > startIdx) {
                                content = content.substring(startIdx, endIdx + 1);
                            } else {
                                content = content.replace("```json", "").replace("```", "").trim();
                            }
                            gResult = objectMapper.readValue(content, List.class);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Groq Roadmap node generation failed: " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("SAVE ROADMAP");
        if (gResult != null && !gResult.isEmpty()) {
            for (Map<String, Object> nodeMap : gResult) {
                try {
                    RoadmapNode node = new RoadmapNode();
                    node.setUser(user);
                    node.setNodeId(user.getId() + "_" + (String) nodeMap.get("nodeId"));
                    node.setTitle((String) nodeMap.get("title"));
                    node.setDifficulty((String) nodeMap.get("difficulty"));
                    node.setHours(((Number) nodeMap.get("hours")).intValue());
                    node.setDescription((String) nodeMap.get("description"));
                    node.setXpReward(((Number) nodeMap.get("xpReward")).intValue());
                    node.setResources((List<String>) nodeMap.get("resources"));
                    node.setProjects((List<String>) nodeMap.get("projects"));
                    node.setInterviewQuestions((List<String>) nodeMap.get("interviewQuestions"));
                    node.setMiniChallenges((List<String>) nodeMap.get("miniChallenges"));
                    roadmapNodeRepository.save(node);
                } catch (Exception ex) {
                    System.err.println("Error saving generated node: " + ex.getMessage());
                    ex.printStackTrace();
                }
            }
        } else {
            // Local fallback nodes
            createFallbackRoadmap(user, skillNames, primaryGoal);
        }
    }

    private void createFallbackRoadmap(User user, List<String> skillNames, String primaryGoal) {
        System.out.println("[PlannerService] Creating custom dynamic fallback roadmap nodes...");
        List<String> activeSkills = skillNames.isEmpty() ? List.of("General Software Development") : skillNames;
        int rewardIndex = 1;
        
        for (String skill : activeSkills) {
            String cleanSkill = skill.trim();
            String skillKey = cleanSkill.toLowerCase().replaceAll("[^a-z0-9]", "-");
            
            // 1. Foundations Node
            RoadmapNode node1 = new RoadmapNode();
            node1.setUser(user);
            node1.setNodeId(user.getId() + "_" + skillKey + "-basics");
            node1.setTitle(cleanSkill + " Foundations");
            node1.setDifficulty("Beginner");
            node1.setHours(10);
            node1.setXpReward(100 + rewardIndex * 20);
            node1.setDescription("Master foundational elements, variables, syntax, and simple workflows in " + cleanSkill);
            node1.setResources(List.of("Official " + cleanSkill + " Documentation", "https://docs.oracle.com/en/", "https://docs.python.org/3/"));
            node1.setProjects(List.of("CLI Console application", "Basic " + cleanSkill + " template"));
            node1.setInterviewQuestions(List.of("What are the primary data types in " + cleanSkill + "?", "How does memory allocation work?"));
            node1.setMiniChallenges(List.of("Write a prime number calculator", "Implement clean error checking"));
            roadmapNodeRepository.save(node1);
            
            // 2. Intermediate / Application Node
            RoadmapNode node2 = new RoadmapNode();
            node2.setUser(user);
            node2.setNodeId(user.getId() + "_" + skillKey + "-intermediate");
            node2.setTitle(cleanSkill + " Application");
            node2.setDifficulty("Intermediate");
            node2.setHours(15);
            node2.setXpReward(150 + rewardIndex * 20);
            node2.setDescription("Build intermediate projects, integrate standard APIs, and use design architectures in " + cleanSkill);
            node2.setResources(List.of("Advanced developer tutorials", "System design guides"));
            node2.setProjects(List.of("Data dashboard app", "REST client integrations"));
            node2.setInterviewQuestions(List.of("Explain async handling or state flow in " + cleanSkill, "What are best practice coding standards?"));
            node2.setMiniChallenges(List.of("Create custom middleware/hook/class", "Optimize list lookup algorithms"));
            roadmapNodeRepository.save(node2);
            
            rewardIndex++;
        }
        
        // Add a final capstone placement node
        RoadmapNode capstoneNode = new RoadmapNode();
        capstoneNode.setUser(user);
        capstoneNode.setNodeId(user.getId() + "_capstone-placement");
        capstoneNode.setTitle(primaryGoal + " Placement Capstone");
        capstoneNode.setDifficulty("Advanced");
        capstoneNode.setHours(25);
        capstoneNode.setXpReward(300);
        capstoneNode.setDescription("Integrate all selected skills to build a complete production-grade application for " + primaryGoal);
        capstoneNode.setResources(List.of("Full-stack system architecture principles", "Production deployment checklists"));
        capstoneNode.setProjects(List.of("Production deployment pipeline", "Interactive Career Simulator project"));
        capstoneNode.setInterviewQuestions(List.of("How do you troubleshoot a scale bottleneck?", "Explain the deployment cycle"));
        capstoneNode.setMiniChallenges(List.of("Build secure API authentication", "Perform a full system load test"));
        roadmapNodeRepository.save(capstoneNode);
    }


    public PlannerResponse generatePlanner(User user) {
        List<UserGoal> goals = userGoalRepository.findByUser(user);
        List<UserSkill> skills = userSkillRepository.findByUser(user);
        List<UserSchedule> schedule = userScheduleRepository.findByUser(user);

        PlannerResponse response = new PlannerResponse();
        response.setGoals(goals.stream().map(UserGoal::getGoalName).toList());
        response.setSkills(generateSkillSummary(skills));
        response.setSchedule(generateScheduleSummary(schedule));
        response.setMilestones(generateMilestones(goals, skills));
        response.setProjects(generateProjects(goals, skills));

        List<Map<String, Object>> weeklyPlan = generateWeeklyPlan(user, skills, schedule);
        response.setWeeklyPlan(weeklyPlan);
        response.setTodayTasks(getTodayTasks(weeklyPlan));

        response.setEstimatedCompletionDate(calculateCompletionDate(skills, schedule));
        response.setCompletionProgress(calculateCompletionProgress(skills));
        response.setSkillProgress(generateSkillProgress(skills));
        response.setUpcomingMilestones(response.getMilestones().stream().limit(3).toList());
        response.setAiSuggestions(generateAiSuggestions(goals, skills, schedule));
        response.setRoadmapProgress(calculateRoadmapProgress(skills));

        return response;
    }

    private List<Map<String, Object>> generateSkillSummary(List<UserSkill> skills) {
        List<Map<String, Object>> summary = new ArrayList<>();
        for (UserSkill skill : skills) {
            Map<String, Object> item = new HashMap<>();
            item.put("skillName", skill.getSkillName());
            item.put("currentLevel", skill.getCurrentLevel());
            item.put("targetLevel", skill.getTargetLevel());
            item.put("status", skill.getStatus());
            item.put("progress", estimateProgress(skill));
            item.put("remainingEffort", calculateRemainingEffort(skill));
            item.put("focus", getFocusLabel(skill));
            summary.add(item);
        }
        return summary;
    }

    private List<Map<String, Object>> generateScheduleSummary(List<UserSchedule> schedule) {
        List<Map<String, Object>> summary = new ArrayList<>();
        for (UserSchedule day : schedule) {
            Map<String, Object> item = new HashMap<>();
            item.put("day", day.getDay());
            item.put("availableHours", day.getAvailableHours());
            summary.add(item);
        }
        return summary;
    }

    private int estimateProgress(UserSkill skill) {
        return switch (skill.getCurrentLevel().toLowerCase()) {
            case "beginner" -> 20;
            case "intermediate" -> 55;
            case "advanced" -> 80;
            default -> 10;
        };
    }

    private int calculateRemainingEffort(UserSkill skill) {
        int current = levelRank(skill.getCurrentLevel());
        int target = levelRank(skill.getTargetLevel());
        return Math.max(1, (target - current) * 12);
    }

    private int levelRank(String level) {
        return switch (Optional.ofNullable(level).orElse("beginner").toLowerCase()) {
            case "beginner" -> 1;
            case "intermediate" -> 2;
            case "advanced" -> 3;
            default -> 1;
        };
    }

    private String getFocusLabel(UserSkill skill) {
        return switch (skill.getCurrentLevel().toLowerCase()) {
            case "beginner" -> "Foundations";
            case "intermediate" -> "Practice";
            case "advanced" -> "Projects";
            default -> "Learning";
        };
    }

    private List<Map<String, Object>> generateMilestones(List<UserGoal> goals, List<UserSkill> skills) {
        List<Map<String, Object>> milestones = new ArrayList<>();
        if (goals.isEmpty() && skills.isEmpty()) {
            milestones.add(Map.of(
                    "title", "Finish onboarding to create your first planner",
                    "description", "Save your career goals, skills, and schedule so AI can generate a live roadmap.",
                    "targetDate", LocalDate.now().plusWeeks(1).format(DateTimeFormatter.ISO_DATE)
            ));
            return milestones;
        }

        int weekOffset = 1;
        for (UserGoal goal : goals) {
            milestones.add(Map.of(
                    "title", "Build foundation for " + goal.getGoalName(),
                    "description", "Complete core skill blocks and a goal-aligned mini project.",
                    "targetDate", LocalDate.now().plusWeeks(weekOffset * 2).format(DateTimeFormatter.ISO_DATE)
            ));
            weekOffset++;
        }

        if (!skills.isEmpty()) {
            int coreWeeks = Math.max(2, skills.size());
            milestones.add(Map.of(
                    "title", "Complete core skill stack",
                    "description", "Advance your selected skills to the target level by keeping daily practice consistent.",
                    "targetDate", LocalDate.now().plusWeeks(coreWeeks).format(DateTimeFormatter.ISO_DATE)
            ));
        }

        return milestones;
    }

    private List<Map<String, Object>> generateProjects(List<UserGoal> goals, List<UserSkill> skills) {
        List<Map<String, Object>> projects = new ArrayList<>();
        if (skills.isEmpty()) {
            projects.add(Map.of(
                    "name", "Personalized onboarding project",
                    "description", "Define your first learning project once your skills are selected.",
                    "estimatedHours", 10
            ));
            return projects;
        }

        for (int index = 0; index < Math.min(skills.size(), 4); index++) {
            UserSkill skill = skills.get(index);
            projects.add(Map.of(
                    "name", skill.getSkillName() + " Growth Project",
                    "description", "Design a hands-on application that blends " + skill.getSkillName() + " with your career goals.",
                    "estimatedHours", 12 + index * 4
            ));
        }

        if (skills.size() > 3) {
            projects.add(Map.of(
                    "name", "Integrated Capstone Project",
                    "description", "Combine multiple skills into one real-world project aligned with your career goal.",
                    "estimatedHours", 20
            ));
        }

        return projects;
    }

    private List<Map<String, Object>> generateWeeklyPlan(User user, List<UserSkill> skills, List<UserSchedule> schedule) {
        List<DailyTask> dailyTasks = dailyTaskRepository.findByUser(user);
        if (dailyTasks.isEmpty()) {
            generateDailyTasks(user);
            dailyTasks = dailyTaskRepository.findByUser(user);
        }

        List<String> weekDays = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");
        List<Map<String, Object>> weeklyPlan = new ArrayList<>();
        
        Map<String, List<DailyTask>> tasksByDay = dailyTasks.stream()
                .collect(Collectors.groupingBy(DailyTask::getDayOfWeek));

        for (String day : weekDays) {
            List<DailyTask> dayTasksList = tasksByDay.getOrDefault(day, Collections.emptyList());
            if (dayTasksList.isEmpty()) {
                Map<String, Object> dayEntry = new HashMap<>();
                dayEntry.put("day", day);
                dayEntry.put("tasks", List.of(Map.of(
                        "title", "Rest and recover strength",
                        "hours", 0,
                        "type", "rest",
                        "completed", true,
                        "modules", Collections.emptyList()
                )));
                weeklyPlan.add(dayEntry);
            } else {
                Map<String, Object> dayEntry = new HashMap<>();
                dayEntry.put("day", day);
                List<Map<String, Object>> taskMaps = new ArrayList<>();
                for (DailyTask dt : dayTasksList) {
                    Map<String, Object> tMap = new HashMap<>();
                    tMap.put("id", dt.getId());
                    tMap.put("title", dt.getTaskTitle());
                    tMap.put("hours", dt.getHours());
                    tMap.put("completed", dt.isCompleted());
                    tMap.put("roadmapNodeId", dt.getRoadmapNodeId());
                    
                    List<DailyTaskModule> modules = dailyTaskModuleRepository.findByDailyTaskOrderByOrderIndexAsc(dt);
                    List<Map<String, Object>> moduleMaps = new ArrayList<>();
                    for (DailyTaskModule m : modules) {
                        Map<String, Object> mMap = new HashMap<>();
                        mMap.put("id", m.getId());
                        mMap.put("title", m.getTitle());
                        mMap.put("description", m.getDescription());
                        mMap.put("duration", m.getDuration());
                        mMap.put("difficulty", m.getDifficulty());
                        mMap.put("xpReward", m.getXpReward());
                        mMap.put("completed", m.isCompleted());
                        mMap.put("orderIndex", m.getOrderIndex());
                        moduleMaps.add(mMap);
                    }
                    tMap.put("modules", moduleMaps);
                    taskMaps.add(tMap);
                }
                dayEntry.put("tasks", taskMaps);
                weeklyPlan.add(dayEntry);
            }
        }
        return weeklyPlan;
    }

    @Transactional
    public void generateDailyTasks(User user) {
        System.out.println("[PlannerService] Generating daily tasks and modules for user: " + user.getUsername());
        
        List<DailyTask> existingTasks = dailyTaskRepository.findByUser(user);
        for (DailyTask t : existingTasks) {
            dailyTaskModuleRepository.deleteByDailyTask(t);
        }
        dailyTaskRepository.deleteByUser(user);
        moduleMessageRepository.deleteByUserId(user.getId());

        List<UserGoal> goals = userGoalRepository.findByUser(user);
        String targetCareer = user.getTargetCareer() != null ? user.getTargetCareer() : (goals.isEmpty() ? "Software Developer" : goals.get(0).getGoalName());
        List<UserSkill> skills = userSkillRepository.findByUser(user);
        List<UserSchedule> schedules = userScheduleRepository.findByUser(user);
        
        List<UserNodeProgress> completedProgress = userNodeProgressRepository.findByUser(user).stream()
                .filter(p -> "completed".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());
        List<String> completedNodeIds = completedProgress.stream()
                .map(p -> p.getRoadmapNode().getNodeId())
                .collect(Collectors.toList());

        List<RoadmapNode> allNodes = roadmapNodeRepository.findByUser(user);
        List<RoadmapNode> incompleteNodes = allNodes.stream()
                .filter(n -> !completedNodeIds.contains(n.getNodeId()))
                .collect(Collectors.toList());

        if (incompleteNodes.isEmpty()) {
            incompleteNodes = allNodes;
        }

        boolean success = false;
        if (groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("${")) {
            try {
                success = generateDailyTasksWithGroq(user, targetCareer, skills, schedules, incompleteNodes);
            } catch (Exception e) {
                System.err.println("[PlannerService] Groq task generation failed: " + e.getMessage());
                e.printStackTrace();
            }
        }

        if (!success) {
            generateDailyTasksFallback(user, schedules, incompleteNodes);
        }
    }

    private boolean generateDailyTasksWithGroq(User user, String targetCareer, List<UserSkill> skills, List<UserSchedule> schedules, List<RoadmapNode> incompleteNodes) {
        StringBuilder schedulesStr = new StringBuilder();
        for (UserSchedule s : schedules) {
            schedulesStr.append("- ").append(s.getDay()).append(": ").append(s.getAvailableHours()).append(" hours\n");
        }

        StringBuilder skillsStr = new StringBuilder();
        for (UserSkill s : skills) {
            skillsStr.append("- ").append(s.getSkillName()).append(" (Level: ").append(s.getCurrentLevel()).append(")\n");
        }

        StringBuilder nodesStr = new StringBuilder();
        for (RoadmapNode n : incompleteNodes) {
            nodesStr.append("- ID: ").append(n.getNodeId()).append(", Title: ").append(n.getTitle()).append(", Description: ").append(n.getDescription()).append("\n");
        }

        String prompt = String.format(
            "You are an AI Personal Tutor. Generate a personalized weekly schedule (Monday to Sunday) of study tasks for a student.\n" +
            "Student Career Goal: %s\n" +
            "Student Skills:\n%s\n" +
            "Student Available Schedule:\n%s\n" +
            "Incomplete Roadmap Nodes to Cover:\n%s\n" +
            "Student Weak Areas: %s\n" +
            "Student Strengths: %s\n\n" +
            "For each day of the week in the student's schedule that has hours > 0, generate EXACTLY ONE task.\n" +
            "Assign each task to cover one of the incomplete roadmap nodes sequentially. Use the roadmapNodeId of the node being covered.\n" +
            "The sum of durations of all modules for a day MUST equal the available hours for that day in minutes (hours * 60).\n\n" +
            "For each module, generate:\n" +
            "- title: (e.g. \"Variables & Data Types\")\n" +
            "- duration: (duration in minutes. The total of all durations for this day must match available hours * 60 minutes!)\n" +
            "- difficulty: (Beginner, Intermediate, or Advanced)\n" +
            "- xpReward: (e.g. duration * 1)\n" +
            "- description: A detailed Markdown explanation containing the following headers:\n" +
            "  ### Topic Overview\n" +
            "  ### Practical Exercise\n" +
            "  ### Mini Quiz\n" +
            "  ### Interview Question\n" +
            "  ### Mini Challenge\n\n" +
            "Format the response strictly as a JSON object with a single key 'weeklySchedule' as a list of daily tasks:\n" +
            "{\n" +
            "  \"weeklySchedule\": [\n" +
            "    {\n" +
            "      \"dayOfWeek\": \"Monday\",\n" +
            "      \"taskTitle\": \"Study: Java Foundations\",\n" +
            "      \"hours\": 2,\n" +
            "      \"roadmapNodeId\": \"java-basics\",\n" +
            "      \"modules\": [\n" +
            "        {\n" +
            "          \"title\": \"Variables\",\n" +
            "          \"duration\": 30,\n" +
            "          \"difficulty\": \"Beginner\",\n" +
            "          \"xpReward\": 30,\n" +
            "          \"description\": \"### Topic Overview\\n...\\n### Practical Exercise\\n...\\n### Mini Quiz\\n...\\n### Interview Question\\n...\\n### Mini Challenge\\n...\"\n" +
            "        }\n" +
            "      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Return ONLY the valid JSON object.",
            targetCareer,
            skillsStr.toString(),
            schedulesStr.toString(),
            nodesStr.toString(),
            user.getWeaknesses() != null ? String.join(", ", user.getWeaknesses()) : "None",
            user.getStrengths() != null ? String.join(", ", user.getStrengths()) : "None"
        );

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> msg = new HashMap<>();
            msg.put("role", "user");
            msg.put("content", prompt);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama-3.3-70b-versatile");
            body.put("messages", List.of(msg));
            body.put("temperature", 0.3);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity("https://api.groq.com/openai/v1/chat/completions", request, Map.class);
            Map<?, ?> response = responseEntity.getBody();

            if (response != null && response.containsKey("choices")) {
                List<?> choices = (List<?>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                    Map<?, ?> messageObj = (Map<?, ?>) choice.get("message");
                    String content = (String) messageObj.get("content");
                    if (content != null) {
                        int startIdx = content.indexOf('{');
                        int endIdx = content.lastIndexOf('}');
                        if (startIdx != -1 && endIdx != -1 && endIdx > startIdx) {
                            content = content.substring(startIdx, endIdx + 1);
                        } else {
                            content = content.replace("```json", "").replace("```", "").trim();
                        }
                        Map<String, Object> data = objectMapper.readValue(content, Map.class);
                        List<Map<String, Object>> weeklySchedule = (List<Map<String, Object>>) data.get("weeklySchedule");
                        if (weeklySchedule != null && !weeklySchedule.isEmpty()) {
                            for (Map<String, Object> dayTaskMap : weeklySchedule) {
                                DailyTask task = new DailyTask();
                                task.setUser(user);
                                task.setDayOfWeek((String) dayTaskMap.get("dayOfWeek"));
                                task.setTaskTitle((String) dayTaskMap.get("taskTitle"));
                                task.setHours(((Number) dayTaskMap.get("hours")).intValue());
                                task.setRoadmapNodeId((String) dayTaskMap.get("roadmapNodeId"));
                                task.setCompleted(false);
                                dailyTaskRepository.save(task);

                                List<Map<String, Object>> modulesList = (List<Map<String, Object>>) dayTaskMap.get("modules");
                                if (modulesList != null) {
                                    int orderIndex = 0;
                                    for (Map<String, Object> moduleMap : modulesList) {
                                        DailyTaskModule module = new DailyTaskModule();
                                        module.setDailyTask(task);
                                        module.setTitle((String) moduleMap.get("title"));
                                        module.setDuration(((Number) moduleMap.get("duration")).intValue());
                                        module.setDifficulty((String) moduleMap.get("difficulty"));
                                        module.setXpReward(((Number) moduleMap.get("xpReward")).intValue());
                                        module.setDescription((String) moduleMap.get("description"));
                                        module.setCompleted(false);
                                        module.setOrderIndex(orderIndex++);
                                        dailyTaskModuleRepository.save(module);
                                    }
                                }
                            }
                            return true;
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[PlannerService] Failed calling Groq to generate daily tasks: " + e.getMessage());
        }
        return false;
    }

    private void generateDailyTasksFallback(User user, List<UserSchedule> schedules, List<RoadmapNode> incompleteNodes) {
        System.out.println("[PlannerService] Running daily task fallback generation...");
        if (schedules.isEmpty() || incompleteNodes.isEmpty()) {
            return;
        }

        int nodeIndex = 0;
        for (UserSchedule sched : schedules) {
            if (sched.getAvailableHours() <= 0) {
                continue;
            }
            RoadmapNode currentNode = incompleteNodes.get(nodeIndex % incompleteNodes.size());
            nodeIndex++;

            DailyTask task = new DailyTask();
            task.setUser(user);
            task.setDayOfWeek(sched.getDay());
            task.setTaskTitle("Study: " + currentNode.getTitle() + " (" + currentNode.getDifficulty() + ")");
            task.setHours(sched.getAvailableHours());
            task.setRoadmapNodeId(currentNode.getNodeId());
            task.setCompleted(false);
            dailyTaskRepository.save(task);

            int hours = sched.getAvailableHours();
            int totalMins = hours * 60;
            int part1 = (int) (totalMins * 0.3);
            int part2 = (int) (totalMins * 0.3);
            int part3 = (int) (totalMins * 0.2);
            int part4 = totalMins - (part1 + part2 + part3);

            DailyTaskModule m1 = new DailyTaskModule();
            m1.setDailyTask(task);
            m1.setTitle(currentNode.getTitle() + " - Core Concepts");
            m1.setDuration(part1);
            m1.setDifficulty(currentNode.getDifficulty());
            m1.setXpReward(part1);
            m1.setCompleted(false);
            m1.setOrderIndex(0);
            m1.setDescription(String.format(
                "### Topic Overview\nThis module covers the core principles and fundamentals of %s. Focus on understanding the primary concepts, architecture, and syntax rules.\n\n" +
                "### Practical Exercise\nCreate a basic structure demonstrating the core concepts. Annotate with comments explaining the lifecycle or code execution.\n\n" +
                "### Mini Quiz\n1. What is the main purpose of %s?\n2. Name two typical structures used.\n\n" +
                "### Interview Question\nWhy is understanding %s crucial for a professional developer?\n\n" +
                "### Mini Challenge\nWrite a 5-line summary of how data flows in this component.",
                currentNode.getTitle(), currentNode.getTitle(), currentNode.getTitle()
            ));
            dailyTaskModuleRepository.save(m1);

            DailyTaskModule m2 = new DailyTaskModule();
            m2.setDailyTask(task);
            m2.setTitle(currentNode.getTitle() + " - Code Practice & Examples");
            m2.setDuration(part2);
            m2.setDifficulty(currentNode.getDifficulty());
            m2.setXpReward(part2);
            m2.setCompleted(false);
            m2.setOrderIndex(1);
            m2.setDescription(String.format(
                "### Topic Overview\nDive into hands-on code examples for %s. Apply best practices to solve standard programmatic problems.\n\n" +
                "### Practical Exercise\nWrite code demonstrating custom execution patterns, error boundaries, and input filtering.\n\n" +
                "### Mini Quiz\n1. How do you handle common exceptions here?\n2. What is the complexity of standard lookups?\n\n" +
                "### Interview Question\nExplain a performance optimization strategy for %s.\n\n" +
                "### Mini Challenge\nRefactor a simple loops-based snippet into a clean modular stream/function.",
                currentNode.getTitle(), currentNode.getTitle()
            ));
            dailyTaskModuleRepository.save(m2);

            DailyTaskModule m3 = new DailyTaskModule();
            m3.setDailyTask(task);
            m3.setTitle(currentNode.getTitle() + " - Interactive Quiz");
            m3.setDuration(part3);
            m3.setDifficulty(currentNode.getDifficulty());
            m3.setXpReward(part3);
            m3.setCompleted(false);
            m3.setOrderIndex(2);
            m3.setDescription(String.format(
                "### Topic Overview\nTest your retention of %s topics. Quick answers to check validation, patterns, and error troubleshooting.\n\n" +
                "### Practical Exercise\nSimulate troubleshooting a failure log from an application using %s.\n\n" +
                "### Mini Quiz\n1. What error is thrown when access is undefined?\n2. How do you resolve scale limits?\n\n" +
                "### Interview Question\nHow does this component behave under high concurrent loads?\n\n" +
                "### Mini Challenge\nFind the bug in the provided code block and fix it.",
                currentNode.getTitle(), currentNode.getTitle()
            ));
            dailyTaskModuleRepository.save(m3);

            DailyTaskModule m4 = new DailyTaskModule();
            m4.setDailyTask(task);
            m4.setTitle(currentNode.getTitle() + " - Interview Prep & Capstone");
            m4.setDuration(part4);
            m4.setDifficulty(currentNode.getDifficulty());
            m4.setXpReward(part4);
            m4.setCompleted(false);
            m4.setOrderIndex(3);
            m4.setDescription(String.format(
                "### Topic Overview\nPrepare for technical recruiter interviews covering %s. Focus on architectural choices, trade-offs, and design patterns.\n\n" +
                "### Practical Exercise\nOutline a micro-system design document using this concept.\n\n" +
                "### Mini Quiz\n1. What are the key trade-offs compared to alternatives?\n2. How is authentication integrated?\n\n" +
                "### Interview Question\nDescribe a real-world scenario where you successfully solved a problem using %s.\n\n" +
                "### Mini Challenge\nWrite a 30-second elevator pitch explaining your solution architecture.",
                currentNode.getTitle(), currentNode.getTitle()
            ));
            dailyTaskModuleRepository.save(m4);
        }
    }

    @Transactional
    public Map<String, Object> toggleTaskModule(User user, Long taskId, Long moduleId) {
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        DailyTaskModule module = dailyTaskModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        if (!module.getDailyTask().getId().equals(taskId)) {
            throw new RuntimeException("Module does not belong to the specified task");
        }

        boolean wasCompleted = module.isCompleted();
        boolean newCompletedState = !wasCompleted;
        module.setCompleted(newCompletedState);
        dailyTaskModuleRepository.save(module);

        int xpReward = module.getXpReward();
        int coinReward = xpReward / 2;

        if (newCompletedState) {
            persistentUser.setXp(persistentUser.getXp() + xpReward);
            persistentUser.setCoins(persistentUser.getCoins() + coinReward);
        } else {
            persistentUser.setXp(Math.max(0, persistentUser.getXp() - xpReward));
            persistentUser.setCoins(Math.max(0, persistentUser.getCoins() - coinReward));
        }

        int requiredXp = persistentUser.getLevel() * 400;
        if (persistentUser.getXp() >= requiredXp) {
            persistentUser.setXp(persistentUser.getXp() - requiredXp);
            persistentUser.setLevel(persistentUser.getLevel() + 1);
        }

        DailyTask task = module.getDailyTask();
        List<DailyTaskModule> allModules = dailyTaskModuleRepository.findByDailyTaskOrderByOrderIndexAsc(task);
        boolean allFinished = allModules.stream().allMatch(DailyTaskModule::isCompleted);
        
        task.setCompleted(allFinished);
        dailyTaskRepository.save(task);

        if (task.getRoadmapNodeId() != null) {
            Optional<RoadmapNode> nodeOpt = roadmapNodeRepository.findByUserAndNodeId(persistentUser, task.getRoadmapNodeId());
            if (nodeOpt.isPresent()) {
                RoadmapNode node = nodeOpt.get();
                UserNodeProgress progress = userNodeProgressRepository.findByUserAndRoadmapNode_NodeId(persistentUser, node.getNodeId())
                        .orElse(new UserNodeProgress());
                progress.setUser(persistentUser);
                progress.setRoadmapNode(node);
                
                if (allFinished) {
                    progress.setStatus("completed");
                    progress.setCompletedAt(LocalDateTime.now());
                    
                    StudySession session = new StudySession();
                    session.setUser(persistentUser);
                    session.setSessionDate(LocalDate.now());
                    session.setSubject(node.getTitle());
                    session.setHours(task.getHours());
                    studySessionRepository.save(session);
                } else {
                    progress.setStatus("in_progress");
                    progress.setCompletedAt(null);
                    
                    List<StudySession> sessionsToday = studySessionRepository.findByUserOrderBySessionDateDesc(persistentUser).stream()
                            .filter(s -> s.getSessionDate().equals(LocalDate.now()) && s.getSubject().equalsIgnoreCase(node.getTitle()))
                            .collect(Collectors.toList());
                    if (!sessionsToday.isEmpty()) {
                        studySessionRepository.delete(sessionsToday.get(0));
                    }
                }
                userNodeProgressRepository.save(progress);
            }
        }

        profileService.updateSkillProgression(persistentUser);
        userRepository.save(persistentUser);
        profileService.refreshCareerReadiness(persistentUser, true);

        Map<String, Object> result = new HashMap<>();
        result.put("moduleCompleted", newCompletedState);
        result.put("taskCompleted", allFinished);
        result.put("xp", persistentUser.getXp());
        result.put("level", persistentUser.getLevel());
        result.put("coins", persistentUser.getCoins());
        return result;
    }

    public List<ModuleMessage> getModuleChat(User user, Long moduleId) {
        return moduleMessageRepository.findByModuleIdAndUserIdOrderByCreatedAtAsc(moduleId, user.getId());
    }

    @Transactional
    public ModuleMessage sendMessageToModuleChat(User user, Long moduleId, String messageText) {
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        DailyTaskModule module = dailyTaskModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        ModuleMessage userMsg = new ModuleMessage();
        userMsg.setModuleId(moduleId);
        userMsg.setUserId(user.getId());
        userMsg.setRole("user");
        userMsg.setMessage(messageText);
        userMsg.setCreatedAt(LocalDateTime.now());
        moduleMessageRepository.save(userMsg);

        List<ModuleMessage> history = moduleMessageRepository.findByModuleIdAndUserIdOrderByCreatedAtAsc(moduleId, user.getId());

        List<UserSkill> skills = userSkillRepository.findByUser(persistentUser);
        StringBuilder skillsStr = new StringBuilder();
        for (UserSkill s : skills) {
            skillsStr.append("- ").append(s.getSkillName()).append(" (Level: ").append(s.getCurrentLevel()).append(")\n");
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an AI Personal Tutor helping the student learn the topic: '").append(module.getTitle()).append("'.\n")
                .append("Career Goal: ").append(persistentUser.getTargetCareer()).append("\n")
                .append("Current Student Skills:\n").append(skillsStr).append("\n")
                .append("Module Details and Content:\n").append(module.getDescription()).append("\n\n")
                .append("Instructions:\n")
                .append("- Respond as a friendly, expert tutor (Duolingo + Khan Academy style).\n")
                .append("- Explain concepts simply, provide clean code snippets, or guide them through exercises.\n")
                .append("- Keep it educational, engaging, and directly related to the question.\n\n")
                .append("Conversation history:\n");

        for (ModuleMessage msg : history) {
            if ("user".equalsIgnoreCase(msg.getRole())) {
                promptBuilder.append("Student: ").append(msg.getMessage()).append("\n");
            } else {
                promptBuilder.append("Tutor: ").append(msg.getMessage()).append("\n");
            }
        }
        promptBuilder.append("Tutor: ");

        String responseText = "";
        if (groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("${")) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(groqApiKey);

                Map<String, Object> msgMap = new HashMap<>();
                msgMap.put("role", "user");
                msgMap.put("content", promptBuilder.toString());

                Map<String, Object> body = new HashMap<>();
                body.put("model", "llama-3.3-70b-versatile");
                body.put("messages", List.of(msgMap));
                body.put("temperature", 0.7);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                ResponseEntity<Map> responseEntity = restTemplate.postForEntity("https://api.groq.com/openai/v1/chat/completions", request, Map.class);
                Map<?, ?> response = responseEntity.getBody();

                if (response != null && response.containsKey("choices")) {
                    List<?> choices = (List<?>) response.get("choices");
                    if (!choices.isEmpty()) {
                        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                        Map<?, ?> messageObj = (Map<?, ?>) choice.get("message");
                        responseText = (String) messageObj.get("content");
                    }
                }
            } catch (Exception e) {
                System.err.println("Groq Tutor Call failed: " + e.getMessage());
            }
        }

        if (responseText == null || responseText.isEmpty()) {
            responseText = "I'm having trouble connecting to my learning matrix right now. Let me summarize the topic for you:\n\n" +
                    "We are discussing **" + module.getTitle() + "**. Focus on practicing the exercise and attempting the mini quiz outlined in the module details!";
        }

        ModuleMessage tutorMsg = new ModuleMessage();
        tutorMsg.setModuleId(moduleId);
        tutorMsg.setUserId(user.getId());
        tutorMsg.setRole("assistant");
        tutorMsg.setMessage(responseText);
        tutorMsg.setCreatedAt(LocalDateTime.now());
        moduleMessageRepository.save(tutorMsg);

        return tutorMsg;
    }

    private List<Map<String, Object>> getTodayTasks(List<Map<String, Object>> weeklyPlan) {
        String today = LocalDate.now().getDayOfWeek().name();
        return weeklyPlan.stream()
                .filter(entry -> today.equalsIgnoreCase((String) entry.get("day")))
                .findFirst()
                .map(entry -> (List<Map<String, Object>>) entry.get("tasks"))
                .orElse(List.of(Map.of("title", "No scheduled tasks for today.", "hours", 0)));
    }

    private String calculateCompletionDate(List<UserSkill> skills, List<UserSchedule> schedule) {
        int weeklyHours = schedule.stream().mapToInt(UserSchedule::getAvailableHours).sum();
        if (weeklyHours == 0 || skills.isEmpty()) {
            return LocalDate.now().plusWeeks(10).format(DateTimeFormatter.ISO_DATE);
        }

        int totalEffort = skills.stream().mapToInt(this::calculateRemainingEffort).sum();
        int weeks = Math.max(2, (totalEffort + weeklyHours - 1) / weeklyHours);
        return LocalDate.now().plusWeeks(weeks).format(DateTimeFormatter.ISO_DATE);
    }

    private int calculateCompletionProgress(List<UserSkill> skills) {
        if (skills.isEmpty()) {
            return 0;
        }
        return (int) skills.stream()
                .mapToInt(this::estimateProgress)
                .average()
                .orElse(0);
    }

    private List<Map<String, Object>> generateSkillProgress(List<UserSkill> skills) {
        List<Map<String, Object>> progress = new ArrayList<>();
        for (UserSkill skill : skills) {
            progress.add(Map.of(
                    "skillName", skill.getSkillName(),
                    "currentLevel", skill.getCurrentLevel(),
                    "targetLevel", skill.getTargetLevel(),
                    "progress", estimateProgress(skill),
                    "remainingEffort", calculateRemainingEffort(skill)
            ));
        }
        return progress;
    }

    private List<String> generateAiSuggestions(List<UserGoal> goals, List<UserSkill> skills, List<UserSchedule> schedule) {
        List<String> suggestions = new ArrayList<>();
        if (goals.isEmpty()) {
            suggestions.add("Pick one or more career goals to guide your roadmap generation.");
        } else {
            suggestions.add("Focus your weekday sessions on foundational skills and reserve weekends for projects.");
            suggestions.add("A consistent 2-hour weekday routine builds momentum faster than a single long session.");
            if (skills.size() > 3) {
                suggestions.add("Spread your skill practice across the week to avoid overload and maintain progress.");
            }
            if (goals.size() == 1) {
                suggestions.add("Your current goal of " + goals.get(0) + " is best supported by hands-on projects in the selected skills.");
            }
        }

        if (schedule.stream().mapToInt(UserSchedule::getAvailableHours).sum() > 20) {
            suggestions.add("You have strong availability this week — prioritize at least one capstone project session.");
        }

        return suggestions;
    }

    private double calculateRoadmapProgress(List<UserSkill> skills) {
        if (skills.isEmpty()) {
            return 0;
        }
        return skills.stream()
                .mapToInt(this::estimateProgress)
                .average()
                .orElse(0.0);
    }
}
