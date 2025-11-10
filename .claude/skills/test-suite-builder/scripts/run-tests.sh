#!/bin/bash

# run-tests.sh - Execute test suite with coverage
# Usage: ./run-tests.sh [--project <project>] [--coverage] [--watch]

set -e

PROJECT=""
COVERAGE=false
WATCH=false
FILTER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --filter)
            FILTER="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--project <project>] [--coverage] [--watch] [--filter <pattern>]"
            exit 1
            ;;
    esac
done

# Default to all test projects if none specified
if [ -z "$PROJECT" ]; then
    PROJECT="tests/**/*.Tests.csproj"
fi

echo "=================================================="
echo "CloudManager Test Runner"
echo "=================================================="
echo "Project: $PROJECT"
echo "Coverage: $COVERAGE"
echo "Watch: $WATCH"
if [ -n "$FILTER" ]; then
    echo "Filter: $FILTER"
fi
echo "=================================================="
echo ""

# Build filter argument
FILTER_ARG=""
if [ -n "$FILTER" ]; then
    FILTER_ARG="--filter $FILTER"
fi

if [ "$COVERAGE" = true ]; then
    echo "Running tests with coverage..."
    dotnet test "$PROJECT" \
        --collect:"XPlat Code Coverage" \
        --results-directory ./TestResults \
        --logger "trx;LogFileName=test-results.trx" \
        --logger "console;verbosity=detailed" \
        $FILTER_ARG

    echo ""
    echo "Test run complete. Generating coverage report..."

    # Check if reportgenerator is installed
    if command -v reportgenerator &> /dev/null; then
        reportgenerator \
            -reports:./TestResults/**/coverage.cobertura.xml \
            -targetdir:./TestResults/CoverageReport \
            -reporttypes:Html

        echo ""
        echo "✅ Coverage report generated"
        echo "   Open: ./TestResults/CoverageReport/index.html"
    else
        echo ""
        echo "⚠️  reportgenerator not installed. Install with:"
        echo "   dotnet tool install -g dotnet-reportgenerator-globaltool"
        echo ""
        echo "Coverage data available at: ./TestResults/**/coverage.cobertura.xml"
    fi

elif [ "$WATCH" = true ]; then
    echo "Running tests in watch mode..."
    dotnet watch test "$PROJECT" $FILTER_ARG

else
    echo "Running tests..."
    dotnet test "$PROJECT" \
        --logger "console;verbosity=detailed" \
        $FILTER_ARG
fi

echo ""
echo "=================================================="
echo "Test run complete"
echo "=================================================="
