FROM eclipse-temurin:23-alpine

WORKDIR /app

COPY target/EurekaServ-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]