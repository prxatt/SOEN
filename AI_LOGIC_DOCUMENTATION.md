# SOEN AI Logic Documentation

## Overview
This document outlines the AI logic system for SOEN, a personal productivity and wellness application. The AI system is designed to provide personalized, context-aware insights and guidance based on user behavior, schedule, and lifestyle.

## Core AI Capabilities

### 1. Daily Greeting & Insights System

#### Morning Insights (Before 12pm)
- **Schedule Analysis**: AI analyzes the user's daily schedule to identify:
  - Events (non-workout, non-meeting activities)
  - Meetings (work-related meetings)
  - Tasks (regular to-dos)
  - Workouts/Exercise sessions

#### Meeting Research & Preparation
- **Meeting Intelligence**:
  - Searches user's notes database for meeting-related content
  - Matches meeting titles with related notes
  - Identifies meeting participants from schedule details
  - Researches meeting topics based on:
    - User's linked notes
    - User's schedule history
    - Related tasks and projects
    - User's behavior patterns

#### Meeting Insights Include:
1. **Agendas**: Auto-generated or extracted from notes
2. **Key Takeaways**: Based on meeting topic and user's previous interactions
3. **Actionable Items**: Pre-meeting preparation tasks
4. **Communication Strategies**: Based on meeting participants and context
5. **Prep Notes**: Links to existing notes related to the meeting
6. **Best Times**: Optimal scheduling based on user's energy patterns

#### Lifestyle-Aware Insights
The AI adapts insights based on user's lifestyle profile:
- **White Collar Worker**: Focus on meeting preparation, deadline management, work-life balance
- **Retail Worker**: Shift scheduling, energy management, customer interaction strategies
- **Freelancer/Self-Employed**: Project management, client communication, income optimization
- **Student**: Study schedules, exam prep, assignment deadlines, learning optimization
- **Homemaker**: Household management, family scheduling, personal time optimization
- **Law Enforcement**: Shift work, stress management, recovery strategies
- **"Free Bird"**: Flexible scheduling, adventure planning, spontaneous productivity

### 2. Contextual Task Filtering

#### Smart Filtering System
When user clicks on summary counts (e.g., "2 events", "2 meetings", "4 tasks"):
- **Events Filter**: Shows only events, hiding meetings and regular tasks
- **Meetings Filter**: Shows only meetings with enhanced meeting details
- **Tasks Filter**: Shows all regular tasks (excluding events/meetings)
- **All View**: Shows everything, maintaining user's current context

### 3. Evening Check-In System (9pm+)

#### Mood Assessment
- **Timing**: Only appears at 9pm or later (configurable per user)
- **Options**: "Great", "Typical", "Good"
- **Purpose**: 
  - Daily reflection and mood tracking
  - Pattern recognition for future insights
  - Motivation journey creation based on daily feedback

#### Evening Insights Generation
- Analyzes completed tasks
- Compares actual vs. planned schedule
- Generates next-day preparation suggestions
- Creates motivation messages based on day's performance

### 4. Task Navigation & Detail Access

#### Direct Task Opening
- When user clicks on a task in Daily Greeting:
  - Navigates to Schedule screen
  - Finds the specific task by ID
  - Opens task detail modal directly (not just "today's view")
  - Maintains context for smooth user experience

### 5. Injury & Schedule Adaptation

#### Adaptive Scheduling
When AI detects or user reports injury/health issue:
- **Automatic Rescheduling**: 
  - Moves affected tasks across multiple days
  - Maintains priority hierarchy
  - Suggests alternative activities
- **Recovery Guidance**:
  - Provides recovery-appropriate task suggestions
  - Adjusts expectations based on recovery timeline
  - Suggests alternative productivity methods

#### Motivation Journey
When user skips a day:
- **Pattern Analysis**: Identifies if skipping is part of a pattern
- **Personalized Motivation**:
  - Empathy-first approach
  - Gentle encouragement
  - Flexible goal adjustment
  - Streak recovery strategies

### 6. Workout-Specific Insights

#### Workout Day Intelligence
When schedule contains only workouts:
- **Hydration Tracking**: 
  - Calculates optimal water intake based on activity level
  - Suggests hydration timing throughout day
- **Key Metrics**: 
  - Tracks physical goals
  - Monitors personal bests
  - Suggests progression paths
- **Pre-Workout Optimization**:
  - Best workout time based on energy patterns
  - Nutrition suggestions
  - Warm-up recommendations
- **Post-Workout Recovery**:
  - Recovery meal suggestions
  - Rest recommendations
  - Next-day preparation

#### Hybrid Days (Work + Workout)
- **Optimal Workout Timing**: Calculated based on:
  - Meeting end times
  - Energy level patterns
  - Recovery needs
- **Energy Management**: Suggests when to take breaks between work and exercise
- **Balance Optimization**: Ensures neither work nor fitness suffers

### 7. Calendar Integration

#### Clickable Calendar Dates
- **Week View**: Shows current week with day/date indicators
- **Task Indicators**: Small dots on days with scheduled tasks
- **Date Navigation**: 
  - Click any date to navigate to Schedule view for that date
  - Maintains user context
  - Shows events for selected date

### 8. Notes Integration & Recent Notes Widget

#### Recent Notes Display
- **Location**: Positioned next to Flow widget
- **Animation**: Looping carousel showing 5 most recent notes
- **Auto-rotation**: Changes every 4 seconds
- **Visual Indicators**: Dots showing current note position
- **Compact Design**: Small, efficient use of space

#### Notes-Task Linking
- **Smart Linking**: AI connects:
  - Tasks with related notes
  - Meetings with prep notes
  - Projects with project notes
  - Goals with related documentation

### 9. Color System & Overlap Prevention

#### Widget Background Colors
- **Tasks Widget**: `#FDE047` (Vibrant Yellow)
- **Habits Widget**: `#F59E0B` (Vibrant Orange)
- **Flow Widget**: `#10B981` (Emerald Green)
- **Focus Timer**: `#3B82F6` (Vibrant Blue)
- **Recent Notes**: `#8B5CF6` (Vibrant Purple)
- **Daily Greeting**: `#0B0B0C` (Dark Background)

#### Category Color Overlap Prevention
- AI checks if category colors match widget backgrounds
- Automatically adjusts category colors if overlap detected:
  - Yellow (#FDE047) → Darker yellow (#FACC15)
  - Orange (#F59E0B) → Lighter orange (#FB923C)
  - Emerald (#10B981) → Lighter emerald (#34D399)

### 10. Widget Size Consistency

#### Uniform Sizing
- **Padding**: All widgets use `p-4 md:p-5 lg:p-6`
- **Header Text**: `text-base md:text-lg lg:text-xl`
- **Consistent Height**: Tasks and Habits maintain same visual height
- **Responsive**: Scales appropriately across screen sizes

## Future AI Enhancements

### Phase 1: Enhanced Personalization

#### User Behavior Learning
- **Pattern Recognition**: 
  - Identify user's most productive times
  - Recognize energy dips and peaks
  - Learn task completion patterns
  - Understand procrastination triggers

#### Lifestyle Profiling
- **Onboarding**: Capture user's profession, lifestyle, goals
- **Behavioral Database**: Track:
  - Task completion rates by category
  - Meeting patterns and preparation habits
  - Workout consistency and timing preferences
  - Sleep patterns and energy correlations
  - Productivity methods that work for user

#### Adaptive Insights
- **Dynamic Adjustment**: Insights evolve based on:
  - User's feedback (mood check-ins)
  - Task completion patterns
  - Schedule adherence
  - Energy level tracking
  - Goal progress

### Phase 2: Predictive Intelligence

#### Schedule Prediction
- **Auto-Scheduling**: Suggest optimal times for:
  - New tasks based on user's patterns
  - Workouts based on energy predictions
  - Breaks based on focus patterns
  - Deep work sessions based on availability

#### Conflict Resolution
- **Intelligent Rescheduling**: 
  - Detects schedule conflicts
  - Suggests optimal alternatives
  - Maintains priority hierarchy
  - Considers user preferences

#### Proactive Suggestions
- **Pre-Meeting Prep**: 
  - Reminds user to review notes 15min before meeting
  - Suggests talking points based on meeting history
  - Prepares questions based on participants
- **Task Preparation**:
  - Suggests materials needed
  - Prepares context based on related notes
  - Optimizes task order for maximum efficiency

### Phase 3: Advanced Research & Intelligence

#### Meeting Intelligence
- **Participant Research**: 
  - Web search for meeting participants (with privacy controls)
  - Extract relevant background information
  - Identify common connections
  - Suggest conversation topics

#### Topic Research
- **Contextual Web Search**:
  - Research meeting topics
  - Find relevant articles and resources
  - Prepare background information
  - Identify key discussion points

#### Note Synthesis
- **Smart Note Linking**:
  - Automatically link related notes
  - Create knowledge graphs
  - Identify patterns across notes
  - Suggest note consolidation

### Phase 4: Injury & Recovery Intelligence

#### Injury Detection
- **Pattern Recognition**: 
  - Detect skipped workout patterns
  - Identify unusual schedule changes
  - Recognize recovery needs

#### Adaptive Recovery
- **Flexible Scheduling**:
  - Automatically reschedule affected activities
  - Suggest alternative activities
  - Adjust expectations realistically
  - Maintain motivation without pressure

#### Recovery Guidance
- **Personalized Recovery Plans**:
  - Suggest appropriate activity levels
  - Recommend recovery-focused tasks
  - Provide encouragement
  - Track recovery progress

### Phase 5: Motivation & Engagement

#### Motivation Journey Creation
- **Pattern-Based Motivation**:
  - Creates personalized motivation messages
  - Adapts to user's emotional state
  - Provides gentle encouragement
  - Celebrates small wins

#### Streak Management
- **Flexible Streaks**:
  - Allows grace periods
  - Suggests recovery strategies
  - Maintains motivation during setbacks
  - Creates "comeback" narratives

#### Goal Adjustment
- **Realistic Goal Setting**:
  - Suggests goal modifications based on performance
  - Prevents overwhelm
  - Maintains challenge without discouragement
  - Celebrates progress, not perfection

### Phase 6: Cross-Platform Intelligence

#### Multi-Device Sync
- **Unified Intelligence**:
  - Syncs insights across devices
  - Maintains context across platforms
  - Adapts to device-specific interactions

#### Context Awareness
- **Location-Based Insights**:
  - Adapts to user's current location
  - Suggests location-appropriate activities
  - Integrates with travel mode

#### Time Zone Intelligence
- **Travel Mode Integration**:
  - Adjusts insights for time zone changes
  - Maintains schedule coherence
  - Adapts expectations for travel

## Technical Implementation Notes

### Data Sources
1. **User Schedule**: Tasks, events, meetings with timestamps
2. **Notes Database**: All user notes with metadata
3. **Health Data**: Sleep, energy levels, activity tracking
4. **Behavior History**: Task completion, mood check-ins, usage patterns
5. **Goals**: User-defined goals and progress tracking

### AI Processing Pipeline
1. **Data Collection**: Gather relevant user data
2. **Pattern Analysis**: Identify patterns and trends
3. **Context Evaluation**: Assess current situation
4. **Insight Generation**: Create personalized insights
5. **Link Discovery**: Find related notes and tasks
6. **Presentation**: Format insights for user display

### Privacy Considerations
- **User Control**: All research features require user consent
- **Data Minimization**: Only collect necessary data
- **Local Processing**: Prefer on-device processing when possible
- **Transparent AI**: User can see why AI made suggestions

### Performance Optimization
- **Caching**: Cache frequent queries and insights
- **Background Processing**: Generate insights asynchronously
- **Progressive Loading**: Load insights incrementally
- **Efficient Searching**: Optimize note and task searches

## User Experience Principles

1. **Empathy First**: AI should feel supportive, not judgmental
2. **Flexibility**: Adapt to user's actual needs, not rigid rules
3. **Transparency**: User understands why AI suggests something
4. **Control**: User can always override AI suggestions
5. **Progressive Disclosure**: Show simple insights first, expandable details
6. **Contextual Relevance**: Insights match user's current situation
7. **Non-Intrusive**: AI assists without interrupting workflow
8. **Personalized**: Every insight considers user's unique situation

## Success Metrics

- **Insight Relevance**: How often insights match user's needs
- **Task Completion**: Improvement in task completion rates
- **User Engagement**: Frequency of interaction with insights
- **Mood Improvement**: Positive trend in evening check-ins
- **Schedule Adherence**: User follows AI-suggested timing
- **Note Utilization**: Increased use of linked notes
- **Overall Satisfaction**: User feedback on AI helpfulness

---

## Changelog

### Version 1.0 (Current)
- ✅ Basic daily insights based on schedule
- ✅ Meeting note linking
- ✅ Task filtering system
- ✅ Evening check-in (9pm+)
- ✅ Calendar date navigation
- ✅ Recent notes widget
- ✅ Color overlap prevention
- ✅ Direct task navigation
- ✅ Lifestyle-aware insights (foundation)

### Future Versions
- 🔄 Enhanced meeting research (web search, participant research)
- 🔄 Advanced pattern recognition
- 🔄 Predictive scheduling
- 🔄 Injury detection and recovery guidance
- 🔄 Motivation journey system
- 🔄 Cross-platform intelligence

