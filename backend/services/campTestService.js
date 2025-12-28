const db = require("../config/database");

/**
 * Create or update a daily test for a camp
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.dayNumber
 * @param {Object} params.testData - { title, description, points, is_active, questions: [...] }
 * @returns {Promise<{status: number, body: Object}>}
 */
const createDailyTest = async ({ campId, dayNumber, testData }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if test exists
    const [existingTests] = await connection.query(
      `SELECT id FROM camp_daily_tests WHERE camp_id = ? AND day_number = ?`,
      [campId, dayNumber]
    );

    let testId;
    if (existingTests.length > 0) {
      // Update existing test
      testId = existingTests[0].id;
      await connection.query(
        `UPDATE camp_daily_tests 
         SET title = ?, description = ?, points = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          testData.title,
          testData.description || null,
          testData.points || 0,
          testData.is_active !== undefined ? testData.is_active : true,
          testId,
        ]
      );

      // Delete existing questions and answers
      const [questions] = await connection.query(
        `SELECT id FROM camp_test_questions WHERE test_id = ?`,
        [testId]
      );
      const questionIds = questions.map((q) => q.id);
      if (questionIds.length > 0) {
        await connection.query(
          `DELETE FROM camp_test_answers WHERE question_id IN (?)`,
          [questionIds]
        );
      }
      await connection.query(
        `DELETE FROM camp_test_questions WHERE test_id = ?`,
        [testId]
      );
    } else {
      // Create new test
      const [result] = await connection.query(
        `INSERT INTO camp_daily_tests (camp_id, day_number, title, description, points, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          campId,
          dayNumber,
          testData.title,
          testData.description || null,
          testData.points || 0,
          testData.is_active !== undefined ? testData.is_active : true,
        ]
      );
      testId = result.insertId;
    }

    // Insert questions and answers
    if (testData.questions && Array.isArray(testData.questions)) {
      for (let i = 0; i < testData.questions.length; i++) {
        const question = testData.questions[i];
        const [questionResult] = await connection.query(
          `INSERT INTO camp_test_questions (test_id, question_text, question_type, order_in_test, points)
           VALUES (?, ?, ?, ?, ?)`,
          [
            testId,
            question.question_text,
            question.question_type,
            i + 1,
            question.points || 1,
          ]
        );
        const questionId = questionResult.insertId;

        // Insert answers
        if (question.answers && Array.isArray(question.answers)) {
          for (let j = 0; j < question.answers.length; j++) {
            const answer = question.answers[j];
            await connection.query(
              `INSERT INTO camp_test_answers (question_id, answer_text, is_correct, explanation, order_in_question)
               VALUES (?, ?, ?, ?, ?)`,
              [
                questionId,
                answer.answer_text,
                answer.is_correct || false,
                answer.explanation || null,
                j + 1,
              ]
            );
          }
        }
      }
    }

    await connection.commit();
    connection.release();

    return {
      status: 200,
      body: {
        success: true,
        message:
          existingTests.length > 0
            ? "تم تحديث الاختبار بنجاح"
            : "تم إنشاء الاختبار بنجاح",
        data: { test_id: testId },
      },
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error creating daily test:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إنشاء الاختبار",
        error: error.message,
      },
    };
  }
};

/**
 * Get daily test for admin (with all details)
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.dayNumber
 * @returns {Promise<{status: number, body: Object}>}
 */
const getDailyTest = async ({ campId, dayNumber }) => {
  try {
    const [tests] = await db.query(
      `SELECT * FROM camp_daily_tests WHERE camp_id = ? AND day_number = ?`,
      [campId, dayNumber]
    );

    if (tests.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "الاختبار غير موجود",
        },
      };
    }

    const test = tests[0];

    // Get questions with answers
    const [questions] = await db.query(
      `SELECT * FROM camp_test_questions 
       WHERE test_id = ? 
       ORDER BY order_in_test`,
      [test.id]
    );

    for (const question of questions) {
      const [answers] = await db.query(
        `SELECT * FROM camp_test_answers 
         WHERE question_id = ? 
         ORDER BY order_in_question`,
        [question.id]
      );
      question.answers = answers;
    }

    test.questions = questions;

    return {
      status: 200,
      body: {
        success: true,
        data: test,
      },
    };
  } catch (error) {
    console.error("Error getting daily test:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الاختبار",
        error: error.message,
      },
    };
  }
};

/**
 * Get all daily tests for a camp (Admin only - list without full details)
 * @param {Object} params
 * @param {number} params.campId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getAllDailyTests = async ({ campId }) => {
  try {
    const [tests] = await db.query(
      `SELECT 
        id,
        camp_id,
        day_number,
        title,
        description,
        points,
        is_active,
        created_at,
        updated_at
      FROM camp_daily_tests 
      WHERE camp_id = ? 
      ORDER BY day_number ASC`,
      [campId]
    );

    return {
      status: 200,
      body: {
        success: true,
        data: tests,
      },
    };
  } catch (error) {
    console.error("Error getting all daily tests:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الاختبارات",
        error: error.message,
      },
    };
  }
};

/**
 * Get test for user (without correct answers before submission)
 * @param {Object} params
 * @param {number} params.testId
 * @param {number} params.userId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getTestForUser = async ({ testId, userId }) => {
  try {
    // Get user enrollment
    const [enrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE user_id = ? 
       AND camp_id = (SELECT camp_id FROM camp_daily_tests WHERE id = ?)
       ORDER BY cohort_number DESC, id DESC 
       LIMIT 1`,
      [userId, testId]
    );

    if (enrollments.length === 0) {
      return {
        status: 403,
        body: {
          success: false,
          message: "غير مسجل في هذا المخيم",
        },
      };
    }

    const enrollmentId = enrollments[0].id;

    // Check if user has already submitted the test
    const [submittedAttempts] = await db.query(
      `SELECT id FROM camp_test_attempts 
       WHERE test_id = ? AND enrollment_id = ? AND submitted_at IS NOT NULL
       LIMIT 1`,
      [testId, enrollmentId]
    );

    const hasAttempted = submittedAttempts.length > 0;

    // Get or create attempt (only if not submitted)
    let attemptId = null;
    if (!hasAttempted) {
      const [existingAttempts] = await db.query(
        `SELECT id FROM camp_test_attempts 
         WHERE test_id = ? AND enrollment_id = ? AND submitted_at IS NULL
         LIMIT 1`,
        [testId, enrollmentId]
      );

      if (existingAttempts.length > 0) {
        attemptId = existingAttempts[0].id;
      } else {
        // Create new attempt when user opens the test
        const [result] = await db.query(
          `INSERT INTO camp_test_attempts (test_id, enrollment_id, user_id)
           VALUES (?, ?, ?)`,
          [testId, enrollmentId, userId]
        );
        attemptId = result.insertId;
      }
    } else {
      attemptId = submittedAttempts[0].id;
    }

    // Get test details
    const [tests] = await db.query(
      `SELECT * FROM camp_daily_tests WHERE id = ? AND is_active = true`,
      [testId]
    );

    if (tests.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "الاختبار غير موجود أو غير نشط",
        },
      };
    }

    const test = tests[0];

    // Get questions
    const [questions] = await db.query(
      `SELECT id, question_text, question_type, order_in_test, points
       FROM camp_test_questions 
       WHERE test_id = ? 
       ORDER BY order_in_test`,
      [test.id]
    );

    // Get answers (without is_correct if not submitted)
    for (const question of questions) {
      const [answers] = await db.query(
        `SELECT id, answer_text, order_in_question
         ${hasAttempted ? ", is_correct, explanation" : ""}
         FROM camp_test_answers 
         WHERE question_id = ? 
         ORDER BY order_in_question`,
        [question.id]
      );
      question.answers = answers;
    }

    test.questions = questions;
    test.has_attempted = hasAttempted;
    test.attempt_id = attemptId;

    return {
      status: 200,
      body: {
        success: true,
        data: test,
      },
    };
  } catch (error) {
    console.error("Error getting test for user:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الاختبار",
        error: error.message,
      },
    };
  }
};

/**
 * Submit test attempt
 * @param {Object} params
 * @param {number} params.attemptId
 * @param {Array} params.responses - [{ question_id, selected_answer_id }]
 * @returns {Promise<{status: number, body: Object}>}
 */
const submitTestAttempt = async ({ attemptId, responses }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get attempt details
    const [attempts] = await connection.query(
      `SELECT * FROM camp_test_attempts WHERE id = ?`,
      [attemptId]
    );

    if (attempts.length === 0) {
      await connection.rollback();
      connection.release();
      return {
        status: 404,
        body: {
          success: false,
          message: "المحاولة غير موجودة",
        },
      };
    }

    const attempt = attempts[0];

    if (attempt.submitted_at) {
      await connection.rollback();
      connection.release();
      return {
        status: 400,
        body: {
          success: false,
          message: "تم إرسال هذا الاختبار مسبقاً",
        },
      };
    }

    // Get test questions and correct answers
    const [questions] = await connection.query(
      `SELECT cq.id, cq.points, ca.id as correct_answer_id
       FROM camp_test_questions cq
       LEFT JOIN camp_test_answers ca ON cq.id = ca.question_id AND ca.is_correct = true
       WHERE cq.test_id = ?`,
      [attempt.test_id]
    );

    let totalScore = 0;
    let totalPoints = 0;

    // Process each response
    for (const question of questions) {
      totalPoints += question.points;
      const response = responses.find((r) => r.question_id === question.id);
      const selectedAnswerId = response ? response.selected_answer_id : null;
      const isCorrect = selectedAnswerId === question.correct_answer_id;
      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      // Save response
      await connection.query(
        `INSERT INTO camp_test_responses (attempt_id, question_id, selected_answer_id, is_correct, points_earned)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         selected_answer_id = VALUES(selected_answer_id),
         is_correct = VALUES(is_correct),
         points_earned = VALUES(points_earned)`,
        [attemptId, question.id, selectedAnswerId, isCorrect, pointsEarned]
      );
    }

    // Calculate percentage
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

    // Update attempt
    await connection.query(
      `UPDATE camp_test_attempts 
       SET score = ?, total_points = ?, percentage = ?, submitted_at = NOW()
       WHERE id = ?`,
      [totalScore, totalPoints, percentage, attemptId]
    );

    // Add bonus points if test has points
    if (totalScore > 0) {
      const [testDetails] = await connection.query(
        `SELECT points FROM camp_daily_tests WHERE id = ?`,
        [attempt.test_id]
      );
      if (testDetails.length > 0 && testDetails[0].points > 0) {
        // Add points to enrollment
        await connection.query(
          `UPDATE camp_enrollments 
           SET total_points = total_points + ?
           WHERE id = ?`,
          [testDetails[0].points, attempt.enrollment_id]
        );
      }
    }

    await connection.commit();
    connection.release();

    return {
      status: 200,
      body: {
        success: true,
        message: "تم إرسال الاختبار بنجاح",
        data: {
          score: totalScore,
          total_points: totalPoints,
          percentage: percentage.toFixed(2),
        },
      },
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error submitting test attempt:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إرسال الاختبار",
        error: error.message,
      },
    };
  }
};

/**
 * Get test results with correct answers and explanations
 * @param {Object} params
 * @param {number} params.attemptId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getTestResults = async ({ attemptId }) => {
  try {
    // Get attempt details
    const [attempts] = await db.query(
      `SELECT cta.*, cdt.title as test_title, cdt.description as test_description
       FROM camp_test_attempts cta
       JOIN camp_daily_tests cdt ON cta.test_id = cdt.id
       WHERE cta.id = ?`,
      [attemptId]
    );

    if (attempts.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المحاولة غير موجودة",
        },
      };
    }

    const attempt = attempts[0];

    if (!attempt.submitted_at) {
      return {
        status: 400,
        body: {
          success: false,
          message: "لم يتم إرسال هذا الاختبار بعد",
        },
      };
    }

    // Get questions with user responses and correct answers
    const [questions] = await db.query(
      `SELECT cq.id, cq.question_text, cq.question_type, cq.order_in_test, cq.points
       FROM camp_test_questions cq
       WHERE cq.test_id = ?
       ORDER BY cq.order_in_test`,
      [attempt.test_id]
    );

    for (const question of questions) {
      // Get user response
      const [responses] = await db.query(
        `SELECT ctr.selected_answer_id, ctr.is_correct, ctr.points_earned
         FROM camp_test_responses ctr
         WHERE ctr.attempt_id = ? AND ctr.question_id = ?`,
        [attemptId, question.id]
      );

      question.user_response = responses.length > 0 ? responses[0] : null;

      // Get all answers with correct answer marked
      const [answers] = await db.query(
        `SELECT id, answer_text, is_correct, explanation, order_in_question
         FROM camp_test_answers
         WHERE question_id = ?
         ORDER BY order_in_question`,
        [question.id]
      );
      question.answers = answers;
    }

    return {
      status: 200,
      body: {
        success: true,
        data: {
          attempt: {
            id: attempt.id,
            score: attempt.score,
            total_points: attempt.total_points,
            percentage: attempt.percentage,
            submitted_at: attempt.submitted_at,
          },
          test: {
            title: attempt.test_title,
            description: attempt.test_description,
          },
          questions: questions,
        },
      },
    };
  } catch (error) {
    console.error("Error getting test results:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب النتائج",
        error: error.message,
      },
    };
  }
};

/**
 * Check if test should open for user (all required tasks completed)
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.dayNumber
 * @param {number} params.userId
 * @returns {Promise<{shouldOpen: boolean, testId?: number, attemptId?: number}>}
 */
const checkIfTestShouldOpen = async ({ campId, dayNumber, userId }) => {
  try {
    // Check if test exists and is active
    const [tests] = await db.query(
      `SELECT id FROM camp_daily_tests 
       WHERE camp_id = ? AND day_number = ? AND is_active = true`,
      [campId, dayNumber]
    );

    if (tests.length === 0) {
      return { shouldOpen: false };
    }

    const testId = tests[0].id;

    // Get user enrollment
    const [enrollments] = await db.query(
      `SELECT id FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ? 
       ORDER BY cohort_number DESC, id DESC 
       LIMIT 1`,
      [userId, campId]
    );

    if (enrollments.length === 0) {
      return { shouldOpen: false };
    }

    const enrollmentId = enrollments[0].id;

    // Check if user already has an attempt (submitted or not)
    const [existingAttempts] = await db.query(
      `SELECT id, submitted_at FROM camp_test_attempts 
       WHERE test_id = ? AND enrollment_id = ?`,
      [testId, enrollmentId]
    );

    if (existingAttempts.length > 0) {
      const attempt = existingAttempts[0];
      // If submitted, test is completed
      if (attempt.submitted_at) {
        return {
          shouldOpen: false,
          testId: testId,
          attemptId: attempt.id,
          isSubmitted: true,
        };
      }
      // If not submitted, test is available but already opened
      return {
        shouldOpen: false,
        testId: testId,
        attemptId: attempt.id,
        isSubmitted: false,
      };
    }

    // Check if all required tasks for this day are completed
    const [requiredTasks] = await db.query(
      `SELECT COUNT(*) as total FROM camp_daily_tasks 
       WHERE camp_id = ? AND day_number = ? AND is_optional = false`,
      [campId, dayNumber]
    );

    const totalRequired = requiredTasks[0].total;

    if (totalRequired === 0) {
      // No required tasks, test can open
      return { shouldOpen: true, testId: testId };
    }

    const [completedTasks] = await db.query(
      `SELECT COUNT(*) as completed 
       FROM camp_task_progress ctp
       JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
       WHERE ctp.enrollment_id = ? 
       AND cdt.camp_id = ? 
       AND cdt.day_number = ? 
       AND cdt.is_optional = false
       AND ctp.completed = true`,
      [enrollmentId, campId, dayNumber]
    );

    const completed = completedTasks[0].completed;

    if (completed >= totalRequired) {
      // All required tasks completed, test can open
      // Don't create attempt here - it will be created when user actually opens the test
      return { shouldOpen: true, testId: testId };
    }

    return { shouldOpen: false, testId: testId };
  } catch (error) {
    console.error("Error checking if test should open:", error);
    return { shouldOpen: false };
  }
};

/**
 * Get test statistics for admin (who attempted, scores, etc.)
 * @param {Object} params
 * @param {number} params.testId
 * @returns {Promise<{status: number, body: Object}>}
 */
const getTestStatistics = async ({ testId }) => {
  try {
    // Get test details
    const [tests] = await db.query(
      `SELECT * FROM camp_daily_tests WHERE id = ?`,
      [testId]
    );

    if (tests.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "الاختبار غير موجود",
        },
      };
    }

    const test = tests[0];

    // Get all attempts with user info
    const [attempts] = await db.query(
      `SELECT 
        cta.id,
        cta.user_id,
        cta.score,
        cta.total_points,
        cta.percentage,
        cta.submitted_at,
        u.username,
        u.email,
        ce.cohort_number
      FROM camp_test_attempts cta
      JOIN users u ON cta.user_id = u.id
      JOIN camp_enrollments ce ON cta.enrollment_id = ce.id
      WHERE cta.test_id = ? AND cta.submitted_at IS NOT NULL
      ORDER BY cta.submitted_at DESC`,
      [testId]
    );

    // Calculate statistics
    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) /
          totalAttempts
        : 0;
    const averagePoints =
      totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
        : 0;

    const passedCount = attempts.filter(
      (a) => parseFloat(a.percentage || 0) >= 70
    ).length;
    const failedCount = attempts.filter(
      (a) => parseFloat(a.percentage || 0) < 70
    ).length;

    return {
      status: 200,
      body: {
        success: true,
        data: {
          test: {
            id: test.id,
            title: test.title,
            day_number: test.day_number,
            points: test.points,
          },
          statistics: {
            total_attempts: totalAttempts,
            average_score: averageScore.toFixed(2),
            average_points: averagePoints.toFixed(2),
            passed_count: passedCount,
            failed_count: failedCount,
            pass_rate:
              totalAttempts > 0
                ? ((passedCount / totalAttempts) * 100).toFixed(2)
                : 0,
          },
          attempts: attempts.map((attempt) => ({
            id: attempt.id,
            user_id: attempt.user_id,
            username: attempt.username,
            email: attempt.email,
            cohort_number: attempt.cohort_number,
            score: attempt.score,
            total_points: attempt.total_points,
            percentage: parseFloat(attempt.percentage || 0),
            submitted_at: attempt.submitted_at,
          })),
        },
      },
    };
  } catch (error) {
    console.error("Error getting test statistics:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب إحصائيات الاختبار",
        error: error.message,
      },
    };
  }
};

module.exports = {
  createDailyTest,
  getDailyTest,
  getAllDailyTests,
  getTestForUser,
  submitTestAttempt,
  getTestResults,
  checkIfTestShouldOpen,
  getTestStatistics,
};
