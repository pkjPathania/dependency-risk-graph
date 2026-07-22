package io.github.pkjpathania.dependencyrisk.workbench.assistant.model;

public record BuggyAnswerRequest(String question, int maxResults, double minScore) {}
