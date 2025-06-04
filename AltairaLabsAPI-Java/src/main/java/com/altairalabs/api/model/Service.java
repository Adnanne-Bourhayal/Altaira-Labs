package com.altairalabs.api.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Entity
@Table(name = "services")
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(unique = true)
    private String name;

    @NotBlank
    @Size(max = 500)
    private String description;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String detailedDescription;

    @NotBlank
    @Size(max = 50)
    private String category;

    @Size(max = 50)
    private String icon;

    private BigDecimal price;

    private boolean isFeatured;

    private int displayOrder;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceFeature> features = new ArrayList<>();

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceBenefit> benefits = new ArrayList<>();

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CaseStudy> caseStudies = new ArrayList<>();

    // Constructors
    public Service() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDetailedDescription() {
        return detailedDescription;
    }

    public void setDetailedDescription(String detailedDescription) {
        this.detailedDescription = detailedDescription;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public boolean isFeatured() {
        return isFeatured;
    }

    public void setFeatured(boolean featured) {
        isFeatured = featured;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ServiceFeature> getFeatures() {
        return features;
    }

    public void setFeatures(List<ServiceFeature> features) {
        this.features = features;
    }

    public List<ServiceBenefit> getBenefits() {
        return benefits;
    }

    public void setBenefits(List<ServiceBenefit> benefits) {
        this.benefits = benefits;
    }

    public List<CaseStudy> getCaseStudies() {
        return caseStudies;
    }

    public void setCaseStudies(List<CaseStudy> caseStudies) {
        this.caseStudies = caseStudies;
    }

    // Helper methods
    public void addFeature(ServiceFeature feature) {
        features.add(feature);
        feature.setService(this);
    }

    public void removeFeature(ServiceFeature feature) {
        features.remove(feature);
        feature.setService(null);
    }

    public void addBenefit(ServiceBenefit benefit) {
        benefits.add(benefit);
        benefit.setService(this);
    }

    public void removeBenefit(ServiceBenefit benefit) {
        benefits.remove(benefit);
        benefit.setService(null);
    }

    public void addCaseStudy(CaseStudy caseStudy) {
        caseStudies.add(caseStudy);
        caseStudy.setService(this);
    }

    public void removeCaseStudy(CaseStudy caseStudy) {
        caseStudies.remove(caseStudy);
        caseStudy.setService(null);
    }
}

